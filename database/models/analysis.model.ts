
import { Schema, model, models } from "mongoose";

// Per-stage status for the progressive pipeline. Every stage is optional so
// documents written before the progressive rework still load and render: an
// old doc simply has no `stages` and a populated `report`.
const StageStatusSchema = new Schema(
  {
    state: { type: String, enum: ["pending", "completed", "error"], default: "pending" },
    startedAt: { type: Date },
    completedAt: { type: Date },
    error: { type: String },
  },
  { _id: false }
);

const AnalysisSchema = new Schema({
  requestId: { type: String, required: true, unique: true },
  userEmail: { type: String, required: true, index: true },
  symbol: { type: String, required: true },
  companyName: { type: String, required: true },
  status: { type: String, enum: ["processing", "completed", "error"], default: "processing" },
  // Final report. Kept under the original name so existing docs and readers
  // are untouched; `finalReport` is an alias for new call sites.
  report: { type: Object },
  // Stage payloads (all Mixed — each stage owns its own shape).
  instantPanel: { type: Object },
  quantAnalysis: { type: Object },
  qualAnalysis: { type: Object },
  stages: {
    type: new Schema(
      {
        instant: { type: StageStatusSchema, default: () => ({}) },
        quant: { type: StageStatusSchema, default: () => ({}) },
        qual: { type: StageStatusSchema, default: () => ({}) },
        report: { type: StageStatusSchema, default: () => ({}) },
      },
      { _id: false }
    ),
    default: () => ({}),
  },
  error: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// `finalReport` reads/writes the same underlying `report` field, so new code
// can use the stage-consistent name without migrating existing documents.
AnalysisSchema.virtual("finalReport")
  .get(function (this: any) {
    return this.report;
  })
  .set(function (this: any, value: any) {
    this.report = value;
  });

const AnalysisRequest = models.AnalysisRequest || model("AnalysisRequest", AnalysisSchema);

export default AnalysisRequest;
