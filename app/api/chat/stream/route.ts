import { NextRequest } from "next/server";
import { auth as authInstance } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { orchestrateQuery, isModeValid } from "@/lib/chat/orchestrator";
import { connectToDatabase } from "@/database/mongoose";
import ChatSession, { IChatMessage } from "@/database/models/chat.model";
import { Mode } from "@/lib/chat/types";

export async function POST(request: NextRequest) {
  try {
    if (!authInstance) {
      return new Response(JSON.stringify({ error: "Auth not initialized" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = await authInstance.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { message, mode, sessionId } = body;

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userMode: Mode | undefined = isModeValid(mode) ? mode : undefined;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ stage: "analyzing", message: "Analyzing query..." })}\n\n`));

          const result = await orchestrateQuery(message, userMode);

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ stage: "complete", message: "Analysis complete" })}\n\n`));

          const responseData = {
            response: result.content,
            mode: result.mode,
            intent: result.intent,
            entity: result.entity,
            sources: result.sources,
            signals: result.signals,
            sentiment: result.sentiment,
            llmResponse: result.response,
            sessionId: null as string | null,
          };

          await connectToDatabase();

          let chatSession;

          if (sessionId) {
            chatSession = await ChatSession.findOne({
              _id: sessionId,
              userEmail: session.user.email,
            });
          }

          const userMessage: IChatMessage = {
            role: "user",
            content: message,
            mode: userMode,
            sources: result.sources,
            createdAt: new Date(),
          };

          const assistantMessage: IChatMessage = {
            role: "assistant",
            content: result.content,
            mode: result.mode,
            sources: result.sources,
            createdAt: new Date(),
          };

          if (chatSession) {
            chatSession.messages.push(userMessage, assistantMessage);
            chatSession.updatedAt = new Date();
            await chatSession.save();
            responseData.sessionId = chatSession._id.toString();
          } else {
            const title = message.substring(0, 50) + (message.length > 50 ? "..." : "");

            chatSession = new ChatSession({
              userEmail: session.user.email,
              title,
              messages: [userMessage, assistantMessage],
              mode: result.mode,
            });
            await chatSession.save();
            responseData.sessionId = chatSession._id.toString();
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ stage: "final", ...responseData })}\n\n`));

          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ stage: "error", message: "Failed to process request" })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat stream API error:", error);
    return new Response(JSON.stringify({ error: "Failed to process message" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
