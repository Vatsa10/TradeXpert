import { Schema, model, models, type Document, type Model } from "mongoose";

// Simulated broking account for paper trading. One per user.
// No real money and no broker linkage — cash here is a local ledger only.
export interface PaperAccount extends Document {
  userEmail: string;
  startingCapital: number; // INR
  cash: number; // INR, uninvested balance
  createdAt: Date;
}

const PaperAccountSchema = new Schema<PaperAccount>(
  {
    userEmail: { type: String, required: true, unique: true, trim: true, lowercase: true },
    startingCapital: { type: Number, required: true, default: 1_000_000 },
    cash: { type: Number, required: true, default: 1_000_000 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const PaperAccountModel: Model<PaperAccount> =
  (models?.PaperAccount as Model<PaperAccount>) ||
  model<PaperAccount>("PaperAccount", PaperAccountSchema);
