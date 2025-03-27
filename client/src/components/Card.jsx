import React from "react";

const Card = ({ title, value, data }) => {
  // Format the value as currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Determine text color based on title or value
  const getTextColor = () => {
    if (title === "Total Spend" || title === "Total Expense (All Projects)")
      return "text-red-500";
    if (title === "Total Gain") return "text-green-500";
    // For Net Profit/Loss, color depends on the value
    return value >= 0 ? "text-green-500" : "text-red-500";
  };

  return (
    <div className="w-full p-6 border-2 border-dotted border-zinc-600 rounded-lg bg-[#1d2125]">
      <h5 className="text-xl font-semibold text-zinc-400 mb-2">{title}</h5>
      <div className={`text-3xl font-bold ${getTextColor()}`}>
        {formatCurrency(value)}
      </div>
      {data && (
        <div className="mt-4 text-sm text-zinc-500">
          {data.length} transactions
        </div>
      )}
    </div>
  );
};

export default Card;
