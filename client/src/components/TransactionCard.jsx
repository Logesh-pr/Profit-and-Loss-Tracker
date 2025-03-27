import React from "react";
import { formatCurrency, formatDate } from "../utils/format";

const TransactionCard = ({ transaction, onEdit, onDelete }) => {
  // Map backend types to UI types
  const getDisplayType = (backendType) => {
    return backendType === "income"
      ? "Income"
      : backendType === "expenses"
      ? "Expense"
      : backendType; // Fallback to original value if unknown
  };

  return (
    <div className="bg-zinc-800 rounded-lg p-4 shadow-md hover:bg-zinc-700 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-white font-medium truncate max-w-[70%]">
          {transaction.description}
        </h3>
        <span
          className={`px-2 py-1 text-xs font-semibold rounded ${
            transaction.type === "income"
              ? "bg-green-900 text-green-300"
              : "bg-red-900 text-red-300"
          }`}
        >
          {getDisplayType(transaction.type)}
        </span>
      </div>
      <div className="mt-2 text-sm text-zinc-400">
        <div>Date: {formatDate(transaction.date)}</div>
        {transaction.updateat && (
          <div>Updated: {formatDate(transaction.updateat)}</div>
        )}
      </div>
      <div className="flex justify-between items-center mt-4">
        <div
          className={`text-xl font-bold ${
            transaction.type === "income" ? "text-green-400" : "text-red-400"
          }`}
        >
          {formatCurrency(transaction.amount)}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(transaction)}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(transaction.id)}
            className="text-zinc-400 hover:text-red-400 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionCard;
