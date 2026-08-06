
import { NextRequest, NextResponse } from "next/server";
import { auth as authInstance } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { orchestrateQuery, isModeValid } from "@/lib/chat/orchestrator";
import { connectToDatabase } from "@/database/mongoose";
import ChatSession, { IChatMessage } from "@/database/models/chat.model";
import { Mode } from "@/lib/chat/types";
import { checkAndIncrementQuota } from "@/lib/chat/quota";

export async function POST(request: NextRequest) {
  try {
    if (!authInstance) {
      return NextResponse.json({ error: "Auth not initialized" }, { status: 500 });
    }

    const session = await authInstance.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { message, mode, sessionId } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const userMode: Mode | undefined = isModeValid(mode) ? mode : undefined;

    const quota = await checkAndIncrementQuota(session.user.email, userMode || "normal");
    if (!quota.allowed) {
      return NextResponse.json(
        { error: quota.reason || "Daily quota exceeded", quota },
        { status: 429 }
      );
    }

    await connectToDatabase();

    let chatSession;

    if (sessionId) {
      chatSession = await ChatSession.findOne({
        _id: sessionId,
        userEmail: session.user.email,
      });
    }

    const priorHistory = (chatSession?.messages || []).map((m: IChatMessage) => ({
      role: m.role,
      content: m.content,
    }));

    const result = await orchestrateQuery(message, userMode, priorHistory);

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
    } else {
      const title = message.substring(0, 50) + (message.length > 50 ? "..." : "");
      
      chatSession = new ChatSession({
        userEmail: session.user.email,
        title,
        messages: [userMessage, assistantMessage],
        mode: result.mode,
      });
      await chatSession.save();
    }

    return NextResponse.json({
      response: result.content,
      mode: result.mode,
      intent: result.intent,
      entity: result.entity,
      sources: result.sources,
      sessionId: chatSession._id.toString(),
      signals: result.signals,
      sentiment: result.sentiment,
      llmResponse: result.response,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!authInstance) {
      return NextResponse.json({ error: "Auth not initialized" }, { status: 500 });
    }

    const session = await authInstance.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    await connectToDatabase();

    if (sessionId) {
      const chatSession = await ChatSession.findOne({
        _id: sessionId,
        userEmail: session.user.email,
      });

      if (!chatSession) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        sessionId: chatSession._id.toString(),
        title: chatSession.title,
        messages: chatSession.messages,
        mode: chatSession.mode,
        createdAt: chatSession.createdAt,
        updatedAt: chatSession.updatedAt,
      });
    }

    const sessions = await ChatSession.find({
      userEmail: session.user.email,
    })
      .sort({ updatedAt: -1 })
      .limit(20)
      .select("title mode createdAt updatedAt messages")
      .lean();

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        sessionId: (s as any)._id.toString(),
        title: s.title,
        mode: s.mode,
        preview: s.messages[s.messages.length - 1]?.content?.substring(0, 100),
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Chat history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!authInstance) {
      return NextResponse.json({ error: "Auth not initialized" }, { status: 500 });
    }

    const session = await authInstance.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    await connectToDatabase();

    await ChatSession.findOneAndDelete({
      _id: sessionId,
      userEmail: session.user.email,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Chat delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete chat" },
      { status: 500 }
    );
  }
}
