import { Schema, model, models, Model } from "mongoose";

export interface IUserQuota {
  userEmail: string;
  date: string; // YYYY-MM-DD, rolls over daily
  standardCount: number;
  proCount: number;
}

const UserQuotaSchema = new Schema<IUserQuota>({
  // No standalone userEmail index: the compound {userEmail, date} index below
  // already has userEmail as its prefix, so a separate one is dead weight on
  // every write.
  userEmail: { type: String, required: true },
  date: { type: String, required: true },
  standardCount: { type: Number, default: 0 },
  proCount: { type: Number, default: 0 },
});

UserQuotaSchema.index({ userEmail: 1, date: 1 }, { unique: true });

const UserQuota: Model<IUserQuota> =
  (models.UserQuota as Model<IUserQuota>) || model<IUserQuota>("UserQuota", UserQuotaSchema);

export default UserQuota;
