
import { Schema, model, models } from "mongoose";

export type ChatMode = "normal" | "thinking" | "pro";

export interface IChatMessage {
  role: "user" | "assistant";
  content: string;
  mode?: ChatMode;
  sources?: string[];
  createdAt: Date;
}

export interface IChatSession {
  userEmail: string;
  title: string;
  messages: IChatMessage[];
  mode: ChatMode;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  mode: { type: String, enum: ["normal", "thinking", "pro"] },
  sources: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

const ChatSessionSchema = new Schema<IChatSession>({
  userEmail: { type: String, required: true, index: true },
  title: { type: String, required: true },
  messages: [ChatMessageSchema],
  mode: { type: String, enum: ["normal", "thinking", "pro"], default: "normal" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const ChatSession = models.ChatSession || model("ChatSession", ChatSessionSchema);

export default ChatSession;
