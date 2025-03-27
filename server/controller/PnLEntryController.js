import PnLEntry from "../model/PnLEntry.js";
import { validationResult } from "express-validator";

const getPnLEntry = async (req, res) => {
  try {
    const { month, year, day } = req.query;

    let query = {};

    // Build query with date filters if provided
    if (month || year || day) {
      // Create date filter
      if (year) {
        const startYear = new Date(parseInt(year), 0, 1);
        const endYear = new Date(parseInt(year) + 1, 0, 1);
        query.date = { $gte: startYear, $lt: endYear };
      }

      if (month && year) {
        const startMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endMonth = new Date(parseInt(year), parseInt(month), 1);
        query.date = { $gte: startMonth, $lt: endMonth };
      }

      if (day && month && year) {
        const startDay = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day)
        );
        const endDay = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day) + 1
        );
        query.date = { $gte: startDay, $lt: endDay };
      }
    }

    const entry = await PnLEntry.find(query);
    res.status(200).json(entry);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const addPnLEntry = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    // Check if this is a project transaction or a general entry
    const projectId = req.params.id;

    // Extract fields from request body
    const {
      type,
      description,
      amount,
      date,
      project: bodyProjectId,
    } = req.body;

    // Use projectId from params if available, otherwise from body
    let projectName = null;

    if (projectId) {
      // This is a project transaction - find the project by ID
      try {
        const project = await import("../model/ProjectModel.js").then(
          (module) => module.default
        );
        const projectDoc = await project.findById(projectId);

        if (!projectDoc) {
          return res.status(404).json({ message: "Project not found" });
        }

        projectName = projectDoc.name;
      } catch (err) {
        return res.status(404).json({ message: "Project not found" });
      }
    } else if (bodyProjectId) {
      // Project ID provided in the body
      try {
        const project = await import("../model/ProjectModel.js").then(
          (module) => module.default
        );
        const projectDoc = await project.findById(bodyProjectId);

        if (projectDoc) {
          projectName = projectDoc.name;
        }
      } catch (err) {}
    }

    // Create new transaction
    const newEntry = new PnLEntry({
      type, // Keep the original type value from frontend
      description,
      cost: amount, // Map amount to cost field
      date: date || new Date(),
      project: projectName || "General", // Use project name or default to "General"
    });

    const entry = await newEntry.save();

    res.status(201).json({
      message: "Transaction added successfully",
      transaction: entry,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export { getPnLEntry, addPnLEntry };
