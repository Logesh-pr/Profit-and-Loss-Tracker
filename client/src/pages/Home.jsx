// Home.jsx
import React, { useState, useEffect } from "react";
// components
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Breadcrumb from "../components/Breadcrumb";
import Card from "../components/Card";
import {
  MonthlyTrendsChart,
  ProjectPerformanceChart,
} from "../components/charts/FinancialCharts";
// Recharts components
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

//apirequest
import { fetchAllData, fetchProjects } from "../config/fetch";
import axios from "axios";
import request from "../config/request";

//react query
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "../utils/format";

const Home = () => {
  const [navbar, setNavbar] = useState(false);
  const [inBound, setInBound] = useState([]);
  const [outBound, setOutBound] = useState([]);
  const [totalInbound, setTotalInbound] = useState(0);
  const [totalOutbound, setTotalOutbound] = useState(0);
  const [netProfit, setNetProfit] = useState(0);

  // New state for overall project financial data
  const [projectTotals, setProjectTotals] = useState({
    totalInbound: 0,
    totalOutbound: 0,
    netProfit: 0,
  });

  // State for chart data
  const [monthlyTrendsData, setMonthlyTrendsData] = useState([]);
  const [projectPerformanceData, setProjectPerformanceData] = useState([]);

  // Add queryClient
  const queryClient = useQueryClient();

  const handleNavbar = () => {
    setNavbar((prev) => !prev);
  };

  const getDateParams = () => {
    return {}; // Empty object to fetch all data without date filtering
  };

  const { data, error, isLoading, isError, refetch } = useQuery({
    queryKey: ["allData"],
    queryFn: () => {
      return fetchAllData({});
    },
    enabled: true,
  });

  // Use React Query to fetch projects data
  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => fetchProjects(),
    enabled: true,
  });

  // Add new query for monthly trends data
  const { data: monthlyData } = useQuery({
    queryKey: ["monthlyTrends"],
    queryFn: () => fetchAllData({}), // Fetch all data without date filters
    enabled: true,
  });

  useEffect(() => {
    if (data?.data) {
      // Extract entries from response - handles different response formats
      let entriesArray = [];

      if (Array.isArray(data.data)) {
        // Direct array response
        entriesArray = data.data;
      } else if (data.data.data && Array.isArray(data.data.data)) {
        // Nested data structure with data property
        entriesArray = data.data.data;
      } else if (data.data.entries && Array.isArray(data.data.entries)) {
        // Response with entries property
        entriesArray = data.data.entries;
      }

      // Process entries to extract transactions from nested entries arrays
      const processedEntries = [];
      entriesArray.forEach((entry) => {
        // Check if the entry has a nested entries array
        if (entry.entries && Array.isArray(entry.entries)) {
          // Process each sub-entry
          entry.entries.forEach((subEntry, index) => {
            processedEntries.push({
              ...subEntry,
              id: entry._id || entry.id,
              entryIndex: index,
              date: subEntry.date || entry.date,
              cost: subEntry.cost || subEntry.amount || 0,
              amount: subEntry.cost || subEntry.amount || 0,
            });
          });
        } else {
          // Entry is already flat
          processedEntries.push({
            ...entry,
            cost: entry.cost || entry.amount || 0,
            amount: entry.cost || entry.amount || 0,
          });
        }
      });

      // Filter by income/expense
      const inboundData = processedEntries.filter(
        (item) => item.type === "income" || item.type === "inbound"
      );
      const outboundData = processedEntries.filter(
        (item) => item.type === "expenses" || item.type === "outbound"
      );

      // Calculate totals
      let inTotal = 0;
      let outTotal = 0;

      inboundData.forEach((item) => {
        if (!isNaN(parseFloat(item.cost || item.amount))) {
          inTotal += parseFloat(item.cost || item.amount);
        }
      });

      outboundData.forEach((item) => {
        if (!isNaN(parseFloat(item.cost || item.amount))) {
          outTotal += parseFloat(item.cost || item.amount);
        }
      });

      setInBound(inboundData);
      setOutBound(outboundData);
      setTotalInbound(inTotal);
      setTotalOutbound(outTotal);
      setNetProfit(inTotal - outTotal);
    }
  }, [data]);

  // Calculate project totals when projectsData changes
  useEffect(() => {
    if (projectsData?.data) {
      let totalInbound = 0;
      let totalOutbound = 0;

      // Process projects to calculate totals
      const projects = Array.isArray(projectsData.data)
        ? projectsData.data
        : projectsData.data.data || [];

      // Prepare project performance data for chart
      const projectChartData = projects
        .map((project) => ({
          id: project._id,
          name: project.name,
          income: parseFloat(project.inbound || 0),
          expense: parseFloat(project.outbound || 0),
          profit:
            parseFloat(project.inbound || 0) -
            parseFloat(project.outbound || 0),
        }))
        .sort((a, b) => b.profit - a.profit) // Sort by profit
        .slice(0, 7); // Get top 7 projects

      setProjectPerformanceData(projectChartData);

      projects.forEach((project) => {
        totalInbound += parseFloat(project.inbound || 0);
        totalOutbound += parseFloat(project.outbound || 0);
      });

      setProjectTotals({
        totalInbound,
        totalOutbound,
        netProfit: totalInbound - totalOutbound,
      });
    }
  }, [projectsData]);

  // Process transaction data to create monthly trends
  useEffect(() => {
    if (monthlyData?.data) {
      // Extract entries from response
      let entriesArray = [];
      if (Array.isArray(monthlyData.data)) {
        entriesArray = monthlyData.data;
      } else if (
        monthlyData.data.data &&
        Array.isArray(monthlyData.data.data)
      ) {
        entriesArray = monthlyData.data.data;
      } else if (
        monthlyData.data.entries &&
        Array.isArray(monthlyData.data.entries)
      ) {
        entriesArray = monthlyData.data.entries;
      }

      // Process entries to extract all transactions with dates
      const transactions = [];
      entriesArray.forEach((entry) => {
        if (entry.entries && Array.isArray(entry.entries)) {
          entry.entries.forEach((subEntry) => {
            const transactionDate = subEntry.date || entry.date;
            if (transactionDate) {
              transactions.push({
                ...subEntry,
                date: transactionDate,
                cost: parseFloat(subEntry.cost || subEntry.amount || 0),
                type: subEntry.type,
              });
            }
          });
        } else if (entry.date) {
          transactions.push({
            ...entry,
            cost: parseFloat(entry.cost || entry.amount || 0),
          });
        }
      });

      // Group transactions by month and type
      const monthlyAggregatedData = {};

      transactions.forEach((transaction) => {
        if (!transaction.date) return;

        // Parse the date correctly
        let date;
        try {
          date = new Date(transaction.date);
          if (isNaN(date.getTime())) return;
        } catch (error) {
          console.warn("Invalid date:", transaction.date);
          return;
        }

        // Create a key for the month-year (e.g., "2024-03" for March 2024)
        const monthYear = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        if (!monthlyAggregatedData[monthYear]) {
          monthlyAggregatedData[monthYear] = {
            month: `${date.toLocaleString("default", {
              month: "short",
            })} ${date.getFullYear()}`,
            income: 0,
            expense: 0,
            rawDate: date, // Used for sorting
          };
        }

        // Add the transaction amount to the appropriate category
        const amount = transaction.cost;
        if (!isNaN(amount)) {
          if (transaction.type === "income" || transaction.type === "inbound") {
            monthlyAggregatedData[monthYear].income += amount;
          } else if (
            transaction.type === "expenses" ||
            transaction.type === "outbound"
          ) {
            monthlyAggregatedData[monthYear].expense += amount;
          }
        }
      });

      // Convert to array and sort by date
      const chartData = Object.values(monthlyAggregatedData)
        .map((item) => ({
          ...item,
          profit: item.income - item.expense,
        }))
        .sort((a, b) => a.rawDate - b.rawDate) // Sort by the actual date
        .map(({ rawDate, ...item }) => item); // Remove the rawDate from final data

      setMonthlyTrendsData(chartData);
    }
  }, [monthlyData]); // Changed dependency to monthlyData

  return (
    <div className="container mx-auto px-4 min-h-[100vh] bg-black text-primary">
      <Navbar handleNavbar={handleNavbar} navbar={navbar} />

      <div className="grid grid-cols-12 md:grid-cols-12 md:gap-x-12">
        <div className="md:col-start-1 md:col-end-5 xl:col-start-1 xl:col-end-3">
          <Sidebar navbar={navbar} setNavbar={setNavbar} />
        </div>

        <div className="col-start-1 col-end-13 md:col-start-5 xl:col-start-3 md:col-end-13">
          <div className="mb-4 flex justify-between items-center">
            <Breadcrumb />
          </div>

          {isLoading ? (
            <div className="text-white text-center">Loading data...</div>
          ) : isError ? (
            <div className="text-red-500 text-center">
              Error loading data: {error.message}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {/* Overall Project Summary Section */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">
                  Overall Financial Summary
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <Card
                    title={"Total Expense (All Projects)"}
                    value={projectTotals.totalOutbound}
                  />
                  <Card
                    title={"Total Income (All Projects)"}
                    value={projectTotals.totalInbound}
                  />
                  <Card
                    title={"Net Profit/Loss (All Projects)"}
                    value={projectTotals.netProfit}
                  />
                </div>

                {/* Financial Performance Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Monthly Income/Expense Trends */}
                  <div className="bg-[#1d2125] p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Monthly Income & Expense Trends
                    </h3>
                    <div className="h-[300px]">
                      <MonthlyTrendsChart
                        data={monthlyTrendsData}
                        isLoading={isLoading}
                      />
                    </div>
                  </div>

                  {/* Project Performance Chart */}
                  <div className="bg-[#1d2125] p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Project Performance
                    </h3>
                    <div className="h-[300px]">
                      <ProjectPerformanceChart data={projectPerformanceData} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily Summary Section */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">
                  Daily Summary
                </h2>
                <div className="flex flex-col sm:flex-row gap-4">
                  {isLoading ? (
                    <div className="w-full flex items-center justify-center py-10 text-zinc-400">
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
                      Loading daily summary...
                    </div>
                  ) : (
                    <>
                      <div className="w-full sm:w-1/3">
                        <Card
                          title={"Total Spend"}
                          value={totalOutbound}
                          data={outBound}
                        />
                      </div>
                      <div className="w-full sm:w-1/3">
                        <Card
                          title={"Total Gain"}
                          value={totalInbound}
                          data={inBound}
                        />
                      </div>
                      <div className="w-full sm:w-1/3">
                        <Card title={"Net Profit/Loss"} value={netProfit} />
                      </div>
                    </>
                  )}
                </div>

                {/* Show info message when no data is available */}
                {!isLoading &&
                  inBound.length === 0 &&
                  outBound.length === 0 && (
                    <div className="mt-4 p-4 bg-[#1d2125] border border-zinc-700 rounded-lg text-zinc-400 text-center">
                      <p>No transactions found.</p>
                      <p className="text-sm mt-2">
                        Add transactions to see them reflected here.
                      </p>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
