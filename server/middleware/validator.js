import { check } from "express-validator";

const PnLEntryValidator = [
  check("description").notEmpty().withMessage("Description is required"),
  check("amount").isNumeric().withMessage("Amount must be a number"),
  check("type")
    .isIn(["inbound", "outbound", "Income", "Expense"])
    .withMessage("Type must be either inbound, outbound, Income, or Expense"),
];

export default PnLEntryValidator;
