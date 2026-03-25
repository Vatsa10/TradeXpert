
"use server"

import { inngest } from "@/lib/inngest/client";
import { connectToDatabase } from "@/database/mongoose";
import AnalysisRequest from "@/database/models/analysis.model";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";

/**
 * Start a stock analysis using Inngest
 */
export async function startAnalysisAction(symbol: string, companyName: string) {
  const session = await auth!.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  
  const userEmail = session.user.email;
  await connectToDatabase();
  
  const requestId = uuidv4();
  
  // 1. Create a request in MongoDB
  await AnalysisRequest.create({
    requestId,
    userEmail,
    symbol,
    companyName,
    status: "processing",
  });
  
  // 2. Trigger Inngest background job
  await inngest.send({
    name: "app/analysis.requested",
    data: {
      requestId,
      symbol,
      companyName,
      userEmail,
    },
  });
  
  return { request_id: requestId, status: "processing" };
}

/**
 * Get analysis status and result from MongoDB
 */
export async function getAnalysisStatusAction(requestId: string) {
  await connectToDatabase();
  
  const request = await AnalysisRequest.findOne({ requestId }).lean();
  
  if (!request) {
    throw new Error("Analysis request not found");
  }
  
  return {
    request_id: request.requestId,
    status: request.status,
    report: (request as any).report, // Final report data
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
