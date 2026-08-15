
"use server"

import { inngest } from "@/lib/inngest/client";
import { connectToDatabase } from "@/database/mongoose";
import AnalysisRequest from "@/database/models/analysis.model";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { buildInstantPanel } from "@/lib/analysis/instant-panel";

/**
 * Start a stock analysis using Inngest
 */
export async function startAnalysisAction(symbol: string, companyName: string) {
  const session = await auth!.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  
  const userEmail = session.user.email;
  await connectToDatabase();
  
  const requestId = uuidv4();

  // 1. Deterministic instant panel (no LLM, sub-second) so the page has real
  // numbers to render before the background agents produce anything. A failure
  // here must not block the analysis — the panel stage is just marked error.
  const startedAt = new Date();
  let instantPanel: Awaited<ReturnType<typeof buildInstantPanel>> | null = null;
  let instantError: string | undefined;
  try {
    instantPanel = await buildInstantPanel(symbol, userEmail);
  } catch (error) {
    instantError = error instanceof Error ? error.message : "Instant panel failed";
    console.error("[analysis] instant panel error:", error);
  }

  // 2. Create a request in MongoDB
  await AnalysisRequest.create({
    requestId,
    userEmail,
    symbol,
    companyName,
    status: "processing",
    instantPanel,
    stages: {
      instant: {
        state: instantPanel ? "completed" : "error",
        startedAt,
        completedAt: new Date(),
        error: instantError,
      },
      quant: { state: "pending", startedAt },
      qual: { state: "pending", startedAt },
      report: { state: "pending", startedAt },
    },
  });

  // 3. Trigger Inngest background job
  await inngest.send({
    name: "app/analysis.requested",
    data: {
      requestId,
      symbol,
      companyName,
      userEmail,
    },
  });
  
  return { request_id: requestId, status: "processing", instant_panel: instantPanel };
}

/**
 * Get analysis status and result from MongoDB
 */
export async function getAnalysisStatusAction(requestId: string) {
  const session = await auth!.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  await connectToDatabase();
  
  const request = await AnalysisRequest.findOne({ 
    requestId,
    userEmail: session.user.email 
  }).lean();
  
  if (!request) {
    throw new Error("Analysis request not found or unauthorized");
  }
  
  return {
    request_id: request.requestId,
    status: request.status,
    report: (request as any).report, // Final report data
    instant_panel: (request as any).instantPanel ?? null,
    quant_analysis: (request as any).quantAnalysis ?? null,
    qual_analysis: (request as any).qualAnalysis ?? null,
    stages: (request as any).stages ?? null,
    error: (request as any).error,
    success: request.status === "completed",
    symbol: request.symbol,
    companyName: request.companyName,
    createdAt: request.createdAt,
  };
}

/**
 * Get analysis history for the logged-in user
 */
export async function getAnalysisHistoryAction() {
  const session = await auth!.api.getSession({ headers: await headers() });
  if (!session?.user) return [];

  await connectToDatabase();
  
  const history = await AnalysisRequest.find({ 
    userEmail: session.user.email,
    status: "completed" 
  })
  .sort({ createdAt: -1 })
  .limit(20)
  .lean();
  
  return JSON.parse(JSON.stringify(history));
}

/**
 * Delete an analysis record
 */
export async function deleteAnalysisAction(requestId: string) {
  const session = await auth!.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  await connectToDatabase();
  
  await AnalysisRequest.deleteOne({ 
    requestId, 
    userEmail: session.user.email 
  });
  
  return { success: true };
}
