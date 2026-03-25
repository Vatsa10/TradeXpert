
import { Schema, model, models } from "mongoose";

const AnalysisSchema = new Schema({
  requestId: { type: String, required: true, unique: true },
  symbol: { type: String, required: true },
  companyName: { type: String, required: true },
  status: { type: String, enum: ["processing", "completed", "error"], default: "processing" },
  report: { type: Object },
  error: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const AnalysisRequest = models.AnalysisRequest || model("AnalysisRequest", AnalysisSchema);

export default AnalysisRequest;
