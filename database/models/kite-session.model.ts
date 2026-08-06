import { Schema, model, models, type Document, type Model } from "mongoose";

/**
 * One Zerodha Kite session per user. The access token is stored encrypted
 * (AES-256-GCM) — see lib/kite/crypto.ts. Never select accessToken into a
 * response payload.
 */
export interface KiteSessionDoc extends Document {
  userEmail: string;
  accessToken: string; // base64 ciphertext
  accessTokenIv: string; // base64
  accessTokenTag: string; // base64 GCM auth tag
  publicToken?: string;
  kiteUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

const KiteSessionSchema = new Schema<KiteSessionDoc>(
  {
    userEmail: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    accessToken: { type: String, required: true },
    accessTokenIv: { type: String, required: true },
    accessTokenTag: { type: String, required: true },
    publicToken: { type: String },
    kiteUserId: { type: String, required: true, trim: true },
    // Kite tokens die at ~06:00 IST daily, so createdAt is what expiry is
    // computed from — it is refreshed on every re-login upsert.
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const KiteSession: Model<KiteSessionDoc> =
  (models?.KiteSession as Model<KiteSessionDoc>) ||
  model<KiteSessionDoc>("KiteSession", KiteSessionSchema);
