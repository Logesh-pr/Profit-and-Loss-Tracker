import { check } from "express-validator";

const ProjectValidator = [
  check("name")
    .notEmpty()
    .withMessage("Project name is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Project name must be between 3 and 100 characters"),
  
  check("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  
  check("client")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Client name cannot exceed 100 characters"),
  
  check("status")
    .optional()
    .isIn(["Planning", "In Progress", "Completed"])
    .withMessage("Status must be one of: Planning, In Progress, Completed")
];

export default ProjectValidator;
