import { Schema, model, models, type Document, type Model } from "mongoose";

// A simulated fill. Positions are NOT stored — they are derived by replaying
// this trade log (see lib/paper/engine.ts computePositions), so the ledger
// stays the single source of truth and can never drift from the positions.
export type PaperTradeSide = "BUY" | "SELL";

export interface PaperTrade extends Document {
  userEmail: string;
  symbol: string;
  side: PaperTradeSide;
  qty: number;
  price: number; // per-share fill price (live quote at simulation time)
  fees: number; // total simulated statutory + brokerage charges, INR
  timestamp: Date;
  rationale: string; // why the trade was taken (AI recommendation or user note)
  status: "FILLED";
}

const PaperTradeSchema = new Schema<PaperTrade>(
  {
    userEmail: { type: String, required: true, index: true, trim: true, lowercase: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    side: { type: String, required: true, enum: ["BUY", "SELL"] },
    qty: { type: Number, required: true },
    price: { type: Number, required: true },
    fees: { type: Number, required: true, default: 0 },
    timestamp: { type: Date, default: Date.now, index: true },
    rationale: { type: String, default: "" },
    status: { type: String, required: true, enum: ["FILLED"], default: "FILLED" },
  },
  { timestamps: false }
);

PaperTradeSchema.index({ userEmail: 1, timestamp: 1 });

export const PaperTradeModel: Model<PaperTrade> =
  (models?.PaperTrade as Model<PaperTrade>) ||
  model<PaperTrade>("PaperTrade", PaperTradeSchema);
