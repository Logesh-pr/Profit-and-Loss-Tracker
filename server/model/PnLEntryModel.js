import { Schema, model } from "mongoose";

const PnLEntrySchema = new Schema({
  type: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  project: { type: String, required: true },
  cost: {
    type: Number,
    required: true,
  },
  date: { type: Date, default: Date.now() },
});

const PnLEntry = new model("PnLEntry", PnLEntrySchema);

export default PnLEntry;
