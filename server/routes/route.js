import express from "express";

//controllers
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from "../controller/ProjectController.js";
import {
  getEntries,
  getProjectEntries,
  createEntry,
  createProjectEntry,
  updateEntry,
  deleteEntry,
} from "../controller/EntryController.js";

//validators
import ProjectValidator from "../middleware/projectValidator.js";
import {
  EntryValidator,
  UpdateEntryValidator,
} from "../middleware/entryValidator.js";

const route = express.Router();

// Project routes
route.get("/projects", getProjects);
route.get("/projects/:id", getProjectById);
route.post("/projects", ProjectValidator, createProject);
route.put("/projects/:id", ProjectValidator, updateProject);
route.delete("/projects/:id", deleteProject);

// Entry routes
route.get("/entries", getEntries);
route.post("/entries", EntryValidator, createEntry);
route.put("/entries/:id", UpdateEntryValidator, updateEntry);
route.delete("/entries/:id", deleteEntry);

// Project-specific entry routes
route.get("/projects/:projectId/entries", getProjectEntries);
route.post("/projects/:projectId/entries", EntryValidator, createProjectEntry);

export default route;
