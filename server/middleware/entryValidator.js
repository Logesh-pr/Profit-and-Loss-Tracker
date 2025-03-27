import { check } from "express-validator";

// For creating new entries
const EntryValidator = [
  check("entries").isArray().withMessage("Entries must be an array"),
  check("entries.*.description")
    .notEmpty()
    .withMessage("Description is required"),
  check("entries.*.type")
    .isIn(["income", "expenses"])
    .withMessage("Type must be either income or expenses"),
  check("entries.*.cost")
    .isNumeric()
    .withMessage("Cost must be a number")
    .isFloat({ min: 0.01 })
    .withMessage("Cost must be greater than 0"),
  check("entries.*.date")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format"),
  check("projectId")
    .notEmpty()
    .withMessage("Project ID is required when creating a new entry"),
];

// For updating existing entries
const UpdateEntryValidator = [
  check("entries").isArray().withMessage("Entries must be an array"),
  check("entries.*.description")
    .notEmpty()
    .withMessage("Description is required"),
  check("entries.*.type")
    .isIn(["income", "expenses"])
    .withMessage("Type must be either income or expenses"),
  check("entries.*.cost")
    .isNumeric()
    .withMessage("Cost must be a number")
    .isFloat({ min: 0.01 })
    .withMessage("Cost must be greater than 0"),
  check("entries.*.date")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format"),
  // No projectId validation for updates
];

export { EntryValidator, UpdateEntryValidator };
