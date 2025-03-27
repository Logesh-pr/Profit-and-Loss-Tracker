import Project from "../model/ProjectModel.js";
import { validationResult } from "express-validator";
import Entry from "../model/EntryModel.js";

/**
 * Get all projects with financial data
 */
const getProjects = async (req, res) => {
  try {
    // Get all projects
    const projects = await Project.find().sort({ createdAt: -1 });

    // Import Entry model
    const Entry = (await import("../model/EntryModel.js")).default;

    // Get financial data for each project
    const projectsWithFinancials = await Promise.all(
      projects.map(async (project) => {
        // Find all entries for this project
        const entries = await Entry.find({ projectId: project._id });

        let inbound = 0;
        let outbound = 0;

        // Calculate totals from all entry documents for this project
        entries.forEach((entry) => {
          entry.entries.forEach((item) => {
            if (item.type === "income") {
              inbound += item.cost;
            } else if (item.type === "expenses") {
              outbound += item.cost;
            }
          });
        });

        // Return project with financial data
        return {
          _id: project._id,
          name: project.name,
          description: project.description,
          client: project.client,
          status: project.status,
          createdAt: project.createdAt,
          inbound: inbound,
          outbound: outbound,
          profit: inbound - outbound,
        };
      })
    );

    res.status(200).json({
      count: projectsWithFinancials.length,
      data: projectsWithFinancials,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get a single project by ID with its transactions
 * @route GET /api/projects/:id
 */
const getProjectById = async (req, res) => {
  try {
    const projectId = req.params.id;

    // Find the project
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Get entries for this project
    const entries = await Entry.find({ projectId: projectId }).sort({
      createdAt: -1,
    });

    // Transform entries into transactions for frontend compatibility
    let transactions = [];
    let inbound = 0;
    let outbound = 0;

    // Process entries and calculate financials
    entries.forEach((entry) => {
      entry.entries.forEach((item, index) => {
        transactions.push({
          id: entry._id,
          entryId: entry._id,
          entryIndex: index,
          description: item.description,
          type: item.type,
          amount: item.cost,
          date: item.date || entry.date,
          createdAt: entry.createdAt,
          updateat: item.updateat || entry.updatedat,
        });

        // Add to totals
        if (item.type === "income") {
          inbound += item.cost;
        } else if (item.type === "expenses") {
          outbound += item.cost;
        }
      });
    });

    // Return project with transactions
    res.status(200).json({
      project: {
        id: project._id,
        name: project.name,
        description: project.description,
        client: project.client,
        status: project.status,
        createdAt: project.createdAt,
        inbound,
        outbound,
      },
      transactions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Create a new project
 * @route POST /api/projects
 */
const createProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, client, status } = req.body;

    // Check if project with same name already exists
    const existingProject = await Project.findOne({ name });
    if (existingProject) {
      return res
        .status(400)
        .json({ message: "Project with this name already exists" });
    }

    // Create new project
    const newProject = new Project({
      name,
      description,
      client,
      status,
    });

    const project = await newProject.save();

    res.status(201).json({
      message: "Project created successfully",
      project: {
        id: project._id,
        name: project.name,
        description: project.description,
        client: project.client,
        status: project.status,
        createdAt: project.createdAt,
        inbound: 0,
        outbound: 0,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update a project
 * @route PUT /api/projects/:id
 */
const updateProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const projectId = req.params.id;
    const { name, description, client, status } = req.body;

    // Find the project
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Update project
    project.name = name;
    project.description = description;
    project.client = client;
    project.status = status;

    await project.save();

    // Calculate financial summary
    const entries = await Entry.find({ projectId: projectId });

    let inbound = 0;
    let outbound = 0;

    entries.forEach((entry) => {
      entry.entries.forEach((item) => {
        if (item.type === "Income") {
          inbound += item.cost;
        } else if (item.type === "Expense") {
          outbound += item.cost;
        }
      });
    });

    res.status(200).json({
      message: "Project updated successfully",
      project: {
        id: project._id,
        name: project.name,
        description: project.description,
        client: project.client,
        status: project.status,
        createdAt: project.createdAt,
        inbound,
        outbound,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Delete a project
 * @route DELETE /api/projects/:id
 */
const deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;

    // Find the project
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Delete all related entries
    await Entry.deleteMany({ projectId: projectId });

    // Delete the project
    await Project.findByIdAndDelete(projectId);

    res.status(200).json({
      message: "Project and all related entries deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
