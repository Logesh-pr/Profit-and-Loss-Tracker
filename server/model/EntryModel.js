import { Schema, model } from "mongoose";

const EntrySchema = new Schema(
  {
    entries: [
      {
        description: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          required: true,
          enum: ["income", "expenses"],
        },
        cost: {
          type: Number,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        updateat: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    updatedat: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Entry = model("Entry", EntrySchema);

export default Entry;
