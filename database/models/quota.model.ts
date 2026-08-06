import { Schema, model, models } from "mongoose";

export interface IUserQuota {
  userEmail: string;
  date: string; // YYYY-MM-DD, rolls over daily
  standardCount: number;
  proCount: number;
}

const UserQuotaSchema = new Schema<IUserQuota>({
  userEmail: { type: String, required: true, index: true },
  date: { type: String, required: true },
  standardCount: { type: Number, default: 0 },
  proCount: { type: Number, default: 0 },
});

UserQuotaSchema.index({ userEmail: 1, date: 1 }, { unique: true });

const UserQuota = models.UserQuota || model("UserQuota", UserQuotaSchema);

export default UserQuota;
