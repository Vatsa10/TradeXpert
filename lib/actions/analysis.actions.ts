
"use server"

import { inngest } from "@/lib/inngest/client";
import { connectToDatabase } from "@/database/mongoose";
import AnalysisRequest from "@/database/models/analysis.model";
import { v4 as uuidv4 } from "uuid";

/**
 * Start a stock analysis using Inngest
 */
export async function startAnalysisAction(symbol: string, companyName: string) {
  await connectToDatabase();
  
  const requestId = uuidv4();
  
  // 1. Create a request in MongoDB
  await AnalysisRequest.create({
    requestId,
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
  };
}
