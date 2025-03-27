import React from "react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1d2125] p-3 border border-zinc-700 rounded-md shadow-lg">
        <p className="text-white font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Format currency helper
const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Monthly Trends Chart Component
export const MonthlyTrendsChart = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-400">
        <svg
          className="animate-spin h-8 w-8 text-blue-500 mr-2"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        Loading chart data...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-400">
        <p>Not enough transaction data to display chart</p>
        <p className="text-sm mt-2">
          Try adding more transactions across different months
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="month" stroke="#888" />
        <YAxis stroke="#888" tickFormatter={formatCurrency} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Area
          type="monotone"
          dataKey="income"
          name="Income"
          stackId="1"
          stroke="#4ade80"
          fill="#15803d"
          fillOpacity={0.8}
        />
        <Area
          type="monotone"
          dataKey="expense"
          name="Expense"
          stackId="2"
          stroke="#f87171"
          fill="#b91c1c"
          fillOpacity={0.8}
        />
        <Line
          type="monotone"
          dataKey="profit"
          name="Net Profit"
          stroke="#60a5fa"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// Project Performance Chart Component
export const ProjectPerformanceChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-400">
        No project data available to display chart
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis type="number" stroke="#888" />
        <YAxis
          dataKey="name"
          type="category"
          stroke="#888"
          width={120}
          tick={{ fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="income" name="Income" fill="#4ade80" />
        <Bar dataKey="expense" name="Expense" fill="#f87171" />
      </BarChart>
    </ResponsiveContainer>
  );
};
