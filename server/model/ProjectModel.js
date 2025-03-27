import { Schema, model } from "mongoose";

const ProjectSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ""
  },
  client: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ["Planning", "In Progress", "Completed"],
    default: "Planning"
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Virtual for calculating inbound and outbound totals
// These will be populated by the controller based on related PnLEntries
ProjectSchema.virtual('inbound').get(function() {
  return 0; // This will be calculated in the controller
});

ProjectSchema.virtual('outbound').get(function() {
  return 0; // This will be calculated in the controller
});

const Project = model("Project", ProjectSchema);

export default Project;
