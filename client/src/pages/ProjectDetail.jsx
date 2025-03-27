import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProjectDetails } from "../config/fetch";
import axios from "axios";
import request from "../config/request";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  formatCurrency,
  formatDate,
  formatDateForInput,
} from "../utils/format";

// components
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Breadcrumb from "../components/Breadcrumb";
import Card from "../components/Card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { IoMdAdd } from "react-icons/io";

// Transaction validation schema
const transactionSchema = yup.object({
  description: yup
    .string()
    .required("Description is required")
    .max(200, "Description must be less than 200 characters"),
  amount: yup
    .number()
    .required("Amount is required")
    .positive("Amount must be positive")
    .typeError("Amount must be a number"),
  date: yup
    .date()
    .required("Date is required")
    .max(new Date(), "Date cannot be in the future")
    .typeError("Invalid date format"),
  type: yup
    .string()
    .oneOf(["Income", "Expense"], "Type must be either Income or Expense")
    .required("Type is required"),
});

// Project edit validation schema
const projectEditSchema = yup.object({
  description: yup
    .string()
    .max(500, "Description must be less than 500 characters"),
  client: yup.string().max(100, "Client name must be less than 100 characters"),
  status: yup
    .string()
    .oneOf(["Planning", "In Progress", "Completed"], "Invalid status")
    .required("Status is required"),
});

// Transaction type options with mapping to backend values
const transactionTypes = [
  { label: "Income", value: "Income", backendValue: "income" },
  { label: "Expense", value: "Expense", backendValue: "expenses" },
];

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [navbar, setNavbar] = useState(false);
  const [projectData, setProjectData] = useState(null);
  const [inBound, setInBound] = useState([]);
  const [outBound, setOutBound] = useState([]);
  const [totalInbound, setTotalInbound] = useState(0);
  const [totalOutbound, setTotalOutbound] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showProjectEditForm, setShowProjectEditForm] = useState(false);
  const queryClient = useQueryClient();

  // Pagination and search states
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [transactionType, setTransactionType] = useState("all");

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: yupResolver(transactionSchema),
    defaultValues: {
      description: "",
      amount: "",
      date: formatDateForInput(new Date()),
      type: "Income",
    },
  });

  // React Hook Form setup for project edit
  const {
    register: registerProjectEdit,
    handleSubmit: handleSubmitProjectEdit,
    formState: { errors: projectEditErrors },
    setValue: setProjectEditValue,
    reset: resetProjectEdit,
  } = useForm({
    resolver: yupResolver(projectEditSchema),
  });

  const handleNavbar = () => {
    setNavbar((prev) => !prev);
  };

  const { data, error, isLoading, isError } = useQuery({
    queryKey: ["projectDetails", projectId],
    queryFn: () => fetchProjectDetails(projectId),
    enabled: !!projectId,
  });

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: (newTransaction) => {
      // Format data to match the new Entry model structure
      const entryData = {
        entries: [
          {
            description: newTransaction.description,
            type:
              transactionTypes.find((t) => t.value === newTransaction.type)
                ?.backendValue || "income",
            cost: parseFloat(newTransaction.amount),
            date: newTransaction.date,
          },
        ],
        date: newTransaction.date,
      };

      // Get the base URL by removing "/entries" from request.allData
      const baseUrl = request.allData.endsWith("/entries")
        ? request.allData.substring(0, request.allData.length - 8)
        : request.allData.replace("/entries", "");

      return axios.post(`${baseUrl}/entries`, {
        ...entryData,
        projectId: projectId,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["projectDetails", projectId],
      });
      setShowForm(false);
      reset();
    },
    onError: (error) => {
      alert(`Failed to add transaction: ${error.message}`);
    },
  });

  // Update transaction mutation
  const updateTransactionMutation = useMutation({
    mutationFn: ({ id, entryIndex, updatedTransaction }) => {
      // Make sure we have a valid ID
      if (!id) {
        return Promise.reject(new Error("Missing entry ID"));
      }

      // Make sure entryIndex is a number and valid
      const parsedIndex = Number(entryIndex);
      if (isNaN(parsedIndex) || parsedIndex < 0) {
        return Promise.reject(new Error("Invalid entry index"));
      }

      // Format data to match Entry model
      const entryData = {
        entries: [
          {
            description: updatedTransaction.description,
            type:
              transactionTypes.find((t) => t.value === updatedTransaction.type)
                ?.backendValue || "income",
            cost: parseFloat(updatedTransaction.amount),
            date: updatedTransaction.date,
          },
        ],
        entryIndex: parsedIndex, // Send as number
        date: updatedTransaction.date,
      };

      // Get the base URL by removing "/entries" from request.allData
      const baseUrl = request.allData.endsWith("/entries")
        ? request.allData.substring(0, request.allData.length - 8)
        : request.allData.replace("/entries", "");

      return axios.put(`${baseUrl}/entries/${id}`, entryData).catch((error) => {
        throw error;
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ["projectDetails", projectId],
      });
      setShowForm(false);
      setEditingTransaction(null);
      reset();
    },
    onError: (error) => {
      alert(
        `Failed to update transaction: ${error.message}\n${
          error.response?.data?.message || ""
        }`
      );
    },
  });

  // Delete transaction mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: ({ id, entryIndex }) => {
      // Get the base URL by removing "/entries" from request.allData
      const baseUrl = request.allData.endsWith("/entries")
        ? request.allData.substring(0, request.allData.length - 8)
        : request.allData.replace("/entries", "");

      return axios.delete(`${baseUrl}/entries/${id}?entryIndex=${entryIndex}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projectDetails", projectId],
      });
    },
    onError: (error) => {
      alert(`Failed to delete transaction: ${error.message}`);
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: (updatedProject) => {
      return axios.put(`${request.projects}/${projectId}`, updatedProject);
    },
    onSuccess: (response) => {
      const updatedProject = response.data.project;
      setProjectData(updatedProject);
      queryClient.invalidateQueries({
        queryKey: ["projectDetails", projectId],
      });
      setShowProjectEditForm(false);
    },
    onError: (error) => {
      alert(`Failed to update project: ${error.message}`);
    },
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "INR",
    }).format(value);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  useEffect(() => {
    if (data?.data) {
      // The API now returns { project, transactions = [] } structure
      const { project, transactions = [] } = data.data;

      // Make sure all transactions have proper entryIndex values
      const processedTransactions = transactions.map((transaction) => {
        // Ensure entryIndex is a number
        if (
          transaction.entryIndex === undefined ||
          transaction.entryIndex === null
        ) {
          transaction.entryIndex = 0;
        } else {
          transaction.entryIndex = Number(transaction.entryIndex);
        }

        // Ensure proper IDs are set
        if (!transaction.id && transaction.entryId) {
          transaction.id = transaction.entryId;
        }

        return transaction;
      });

      setProjectData({
        ...project,
        transactions: processedTransactions,
      });

      const inboundData = processedTransactions.filter(
        (item) => item.type === "income"
      );
      const outboundData = processedTransactions.filter(
        (item) => item.type === "expenses"
      );

      let inTotal = 0;
      let outTotal = 0;

      inboundData.forEach((item) => {
        if (item.amount && !isNaN(parseFloat(item.amount))) {
          inTotal += parseFloat(item.amount);
        } else if (item.cost && !isNaN(parseFloat(item.cost))) {
          inTotal += parseFloat(item.cost);
        }
      });

      outboundData.forEach((item) => {
        if (item.amount && !isNaN(parseFloat(item.amount))) {
          outTotal += parseFloat(item.amount);
        } else if (item.cost && !isNaN(parseFloat(item.cost))) {
          outTotal += parseFloat(item.cost);
        }
      });

      setInBound(inboundData);
      setOutBound(outboundData);
      setTotalInbound(inTotal);
      setTotalOutbound(outTotal);
      setNetProfit(inTotal - outTotal);
      setFilteredTransactions(processedTransactions);
    }
  }, [data]);

  // Filter transactions based on search term and transaction type
  useEffect(() => {
    if (projectData?.transactions) {
      let filtered = [...projectData.transactions];

      // Filter by type if not "all"
      if (transactionType !== "all") {
        filtered = filtered.filter(
          (transaction) =>
            (transactionType === "Income" && transaction.type === "income") ||
            (transactionType === "Expense" && transaction.type === "expenses")
        );
      }

      // Filter by search term
      if (searchTerm.trim() !== "") {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (transaction) =>
            transaction.description?.toLowerCase().includes(searchLower) ||
            formatDate(transaction.date).toLowerCase().includes(searchLower)
        );
      }

      setFilteredTransactions(filtered);
    }
  }, [projectData, searchTerm, transactionType]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  const goBack = () => {
    navigate("/projects");
  };

  const handleAddTransaction = () => {
    setEditingTransaction(null);
    reset({
      description: "",
      amount: "",
      date: formatDateForInput(new Date()),
      type: "Income",
    });
    setShowForm(true);
  };

  const handleEditTransaction = (transaction) => {
    // Convert backend type to UI type for the form
    const uiType =
      transaction.type === "income"
        ? "Income"
        : transaction.type === "expenses"
        ? "Expense"
        : transaction.type;

    // Make sure we have a valid entryIndex
    const entryIndex =
      typeof transaction.entryIndex === "number" ? transaction.entryIndex : 0;

    // Store the transaction with its entry index for updating
    setEditingTransaction({
      ...transaction,
      // Ensure we have the ID correctly stored in both properties
      id: transaction.id || transaction.entryId,
      _id: transaction.id || transaction.entryId,
      entryIndex: entryIndex,
    });

    reset({
      description: transaction.description,
      amount: transaction.amount?.toString() || "0",
      date: transaction.date
        ? formatDateForInput(new Date(transaction.date))
        : formatDateForInput(new Date()),
      type: uiType,
    });
    setShowForm(true);
  };

  // Modified form submission handler
  const onSubmit = (data) => {
    if (editingTransaction) {
      // Make sure we have a valid ID (check for both _id and id properties)
      const entryId = editingTransaction._id || editingTransaction.id;

      // If entry ID is a string in MongoDB ObjectID format (24 hex chars)
      const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(entryId);

      if (!entryId || !isValidMongoId) {
        alert("Error: Cannot update transaction without a valid ID");
        return;
      }

      // Make sure entryIndex is a valid number
      const entryIndex = Number(editingTransaction.entryIndex);
      if (isNaN(entryIndex) || entryIndex < 0) {
        alert("Error: Invalid entry index");
        return;
      }

      // Handle existing transaction edit
      updateTransactionMutation.mutate({
        id: entryId,
        entryIndex: entryIndex,
        updatedTransaction: {
          description: data.description,
          amount: parseFloat(data.amount),
          date: data.date,
          type: data.type,
        },
      });
    } else {
      // Create new transaction
      createTransactionMutation.mutate({
        description: data.description,
        amount: parseFloat(data.amount),
        date: data.date,
        type: data.type,
      });
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingTransaction(null);
    reset();
  };

  // Helper function to map backend types to UI display types
  const getDisplayType = (backendType) => {
    return backendType === "income"
      ? "Income"
      : backendType === "expenses"
      ? "Expense"
      : backendType; // Fallback to original value if unknown
  };

  const handleDeleteTransaction = (transaction) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      deleteTransactionMutation.mutate({
        id: transaction.id,
        entryIndex: transaction.entryIndex,
      });
    }
  };

  // Handle project edit form submission
  const onSubmitProjectEdit = (data) => {
    updateProjectMutation.mutate({
      name: projectData.name, // Keep the name the same
      description: data.description,
      client: data.client,
      status: data.status,
    });
  };

  // Open project edit form
  const handleEditProject = () => {
    if (projectData) {
      setProjectEditValue("description", projectData.description || "");
      setProjectEditValue("client", projectData.client || "");
      setProjectEditValue("status", projectData.status || "Planning");
      setShowProjectEditForm(true);
    }
  };

  // Cancel project edit
  const handleCancelProjectEdit = () => {
    setShowProjectEditForm(false);
    resetProjectEdit();
  };

  return (
    <div className="container mx-auto px-4 min-h-[100vh] bg-black text-primary overflow-hidden">
      <Navbar handleNavbar={handleNavbar} navbar={navbar} />

      <div className="grid grid-cols-12 md:grid-cols-12  md:gap-x-12 ">
        <div className="md:col-start-1 md:col-end-5 xl:col-start-1 xl:col-end-3">
          <Sidebar navbar={navbar} setNavbar={setNavbar} />
        </div>

        <div className="col-start-1 col-end-13 md:col-start-5 xl:col-start-3 md:col-end-13">
          <div className="mb-4 md:mb-6">
            <div className="flex items-center mb-2">
              <button
                onClick={goBack}
                className="mr-2 md:mr-3 p-2 rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                aria-label="Go back to projects"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <Breadcrumb />
            </div>

            {projectData && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <h1 className="text-xl sm:text-2xl font-bold text-white break-words max-w-full">
                  {projectData.name}
                </h1>
                <div className="mt-1 sm:mt-0 text-zinc-400 text-xs sm:text-sm">
                  Created on {formatDate(projectData.createdAt)}
                </div>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="text-white text-center">
              Loading project details...
            </div>
          ) : isError ? (
            <div className="text-red-500 text-center">
              Error loading project details: {error.message}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-8">
                <Card
                  title={"Total Spend"}
                  value={totalOutbound}
                  data={outBound}
                />
                <Card
                  title={"Total Gain"}
                  value={totalInbound}
                  data={inBound}
                />
                <Card title={"Net Profit/Loss"} value={netProfit} />
              </div>

              <div className="bg-[#1d2125] rounded-lg p-3 sm:p-4 mb-4 md:mb-8">
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <h2 className="text-base sm:text-lg font-semibold text-white">
                    Project Details
                  </h2>
                  {projectData && !showProjectEditForm && (
                    <button
                      onClick={handleEditProject}
                      className="text-xs sm:text-sm p-1.5 rounded-lg px-4 py-2 bg-white hover:bg-zinc-200 text-black transition-colors flex items-center cursor-pointer"
                      title="Edit project details"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Edit
                    </button>
                  )}
                </div>

                {showProjectEditForm ? (
                  <form
                    onSubmit={handleSubmitProjectEdit(onSubmitProjectEdit)}
                    className="space-y-4"
                  >
                    <div>
                      <label
                        htmlFor="description"
                        className="block text-sm text-zinc-400 mb-1"
                      >
                        Description
                      </label>
                      <textarea
                        id="description"
                        rows="3"
                        className="w-full bg-[#101214] text-white border border-zinc-700 rounded-lg p-2.5 text-sm"
                        placeholder="Project description"
                        {...registerProjectEdit("description")}
                      />
                      {projectEditErrors.description && (
                        <p className="text-red-500 text-xs mt-1">
                          {projectEditErrors.description.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="client"
                        className="block text-sm text-zinc-400 mb-1"
                      >
                        Client
                      </label>
                      <input
                        type="text"
                        id="client"
                        className="w-full bg-[#101214] text-white border border-zinc-700 rounded-lg p-2.5 text-sm"
                        placeholder="Client name"
                        {...registerProjectEdit("client")}
                      />
                      {projectEditErrors.client && (
                        <p className="text-red-500 text-xs mt-1">
                          {projectEditErrors.client.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="status"
                        className="block text-sm text-zinc-400 mb-1"
                      >
                        Status
                      </label>
                      <select
                        id="status"
                        className="w-full bg-[#101214] text-white border border-zinc-700 rounded-lg p-2.5 text-sm"
                        {...registerProjectEdit("status")}
                      >
                        <option value="Planning">Planning</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                      {projectEditErrors.status && (
                        <p className="text-red-500 text-xs mt-1">
                          {projectEditErrors.status.message}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                        disabled={updateProjectMutation.isPending}
                      >
                        {updateProjectMutation.isPending
                          ? "Saving..."
                          : "Update Project"}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelProjectEdit}
                        className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-md text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  projectData && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <p className="text-zinc-400 text-sm mb-1">
                          Description
                        </p>
                        <p className="text-white text-sm sm:text-base break-words">
                          {projectData.description ||
                            "No description available"}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-400 text-sm mb-1">Client</p>
                        <p className="text-white text-sm sm:text-base break-words">
                          {projectData.client || "Not specified"}
                        </p>
                      </div>
                      {projectData.status && (
                        <div>
                          <p className="text-zinc-400 text-sm mb-1">Status</p>
                          <span
                            className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium inline-block ${
                              projectData.status === "Completed"
                                ? "bg-green-900 text-green-300"
                                : projectData.status === "In Progress"
                                ? "bg-blue-900 text-blue-300"
                                : "bg-orange-900 text-orange-300"
                            }`}
                          >
                            {projectData.status}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>

              <div className="bg-[#1d2125] rounded-lg p-3 sm:p-4">
                <div className="flex flex-col gap-y-4 sm:flex-row  justify-between items-center mb-4">
                  <h2 className="text-base sm:text-lg font-semibold text-white">
                    Transactions
                  </h2>
                  <button
                    onClick={handleAddTransaction}
                    className="flex items-center gap-2 bg-white hover:bg-gray-200 text-black px-3 py-1.5 rounded-md transition-colors text-sm"
                  >
                    <IoMdAdd className="text-lg" /> Add Transaction
                  </button>
                </div>

                {/* Updated Transaction Form */}
                {showForm && (
                  <div className="bg-[#161b22] p-4 rounded-lg mb-6 shadow-lg border border-zinc-800">
                    <h3 className="text-lg font-semibold mb-3 text-white">
                      {editingTransaction
                        ? "Edit Transaction"
                        : "Add New Entry"}
                    </h3>

                    <form
                      onSubmit={handleSubmit(onSubmit)}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1 text-zinc-300">
                            Description*
                          </label>
                          <input
                            type="text"
                            {...register("description")}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                            placeholder="Enter item description"
                          />
                          {errors.description && (
                            <p className="text-red-400 text-sm mt-1">
                              {errors.description.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1 text-zinc-300">
                            Amount*
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            {...register("amount")}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                            placeholder="0.00"
                          />
                          {errors.amount && (
                            <p className="text-red-400 text-sm mt-1">
                              {errors.amount.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1 text-zinc-300">
                            Date*
                          </label>
                          <input
                            type="date"
                            {...register("date")}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                          />
                          {errors.date && (
                            <p className="text-red-400 text-sm mt-1">
                              {errors.date.message}
                            </p>
                          )}
                        </div>

                        <div className="mb-4">
                          <label
                            htmlFor="type"
                            className="block text-sm font-medium mb-1 text-zinc-300"
                          >
                            Type*
                          </label>
                          <select
                            id="type"
                            {...register("type", {
                              required: "Type is required",
                            })}
                            className={`w-full bg-zinc-800 border rounded px-3 py-2 text-white ${
                              errors.type ? "border-red-500" : "border-zinc-700"
                            }`}
                          >
                            {transactionTypes.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          {errors.type && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.type.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        {editingTransaction ? (
                          <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                            disabled={updateTransactionMutation.isPending}
                          >
                            {updateTransactionMutation.isPending
                              ? "Saving..."
                              : "Update Transaction"}
                          </button>
                        ) : (
                          <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                            disabled={createTransactionMutation.isPending}
                          >
                            {createTransactionMutation.isPending
                              ? "Saving..."
                              : "Add Transaction"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleCancelForm}
                          className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-md transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Search and filter controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-4 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-zinc-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="type-filter"
                      className="text-white text-sm whitespace-nowrap"
                    >
                      Type:
                    </label>
                    <select
                      id="type-filter"
                      className="bg-[#1d2125] text-white border border-zinc-700 rounded p-2 text-sm"
                      value={transactionType}
                      onChange={(e) => setTransactionType(e.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="entries-per-page"
                      className="text-white text-sm whitespace-nowrap"
                    >
                      Show
                    </label>
                    <select
                      id="entries-per-page"
                      className="bg-[#1d2125] text-white border border-zinc-700 rounded p-2 text-sm"
                      value={itemsPerPage}
                      onChange={handleItemsPerPageChange}
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                    </select>
                    <span className="text-white text-sm whitespace-nowrap">
                      entries
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto -mx-3 sm:mx-0 pb-2">
                  <div className="min-w-full inline-block align-middle px-3 sm:px-0">
                    <div className="min-w-[640px]">
                      <Table>
                        <TableCaption>
                          List of all transactions for this project
                        </TableCaption>
                        <TableHeader>
                          <TableRow className="bg-zinc-800 border-zinc-700">
                            <TableHead className="whitespace-nowrap">
                              Date
                            </TableHead>
                            <TableHead className="max-w-[150px] sm:max-w-none">
                              Description
                            </TableHead>
                            <TableHead className="whitespace-nowrap">
                              Type
                            </TableHead>
                            <TableHead className="text-right whitespace-nowrap">
                              Amount
                            </TableHead>
                            <TableHead className="text-right whitespace-nowrap">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentTransactions.length > 0 ? (
                            currentTransactions.map((transaction, index) => (
                              <TableRow
                                key={`${transaction.id}-${transaction.entryIndex}`}
                                className={`border-b border-zinc-700 hover:bg-zinc-800 transition-colors ${
                                  editingTransaction &&
                                  editingTransaction.id === transaction.id
                                    ? "bg-zinc-800"
                                    : ""
                                }`}
                                onClick={() =>
                                  handleEditTransaction(transaction)
                                }
                              >
                                <TableCell className="py-4 px-6 whitespace-nowrap text-white">
                                  {formatDate(transaction.date)}
                                </TableCell>
                                <TableCell className="py-4 px-6 text-white">
                                  <div className="max-w-xs truncate">
                                    {transaction.description}
                                  </div>
                                </TableCell>
                                <TableCell className="py-4 px-6">
                                  <span
                                    className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                                      transaction.type === "income"
                                        ? "bg-green-900 text-green-300"
                                        : "bg-red-900 text-red-300"
                                    }`}
                                  >
                                    {getDisplayType(transaction.type)}
                                  </span>
                                </TableCell>
                                <TableCell
                                  className={`py-4 px-6 font-medium ${
                                    transaction.type === "income"
                                      ? "text-green-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  {formatCurrency(transaction.amount)}
                                </TableCell>
                                <TableCell className="py-4 px-6 whitespace-nowrap text-right">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent row click
                                      handleEditTransaction(transaction);
                                    }}
                                    className="text-zinc-400 hover:text-white transition-colors mr-3"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent row click
                                      handleDeleteTransaction(transaction);
                                    }}
                                    className="text-zinc-400 hover:text-red-400 transition-colors"
                                  >
                                    Delete
                                  </button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="h-24 text-center text-zinc-400"
                              >
                                {searchTerm || transactionType !== "all"
                                  ? "No transactions found matching your filters."
                                  : "No transactions found for this project."}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>

                {/* Pagination controls */}
                {filteredTransactions.length > 0 && (
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-4 text-sm">
                    <div className="text-zinc-400">
                      Showing {indexOfFirstItem + 1} to{" "}
                      {Math.min(indexOfLastItem, filteredTransactions.length)}{" "}
                      of {filteredTransactions.length} entries
                      {(searchTerm || transactionType !== "all") &&
                        projectData?.transactions && (
                          <span>
                            {" "}
                            (filtered from {
                              projectData.transactions.length
                            }{" "}
                            total entries)
                          </span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-1 justify-center">
                      <button
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded ${
                          currentPage === 1
                            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                            : "bg-zinc-700 text-white hover:bg-zinc-600"
                        }`}
                      >
                        First
                      </button>
                      {totalPages <= 5 ? (
                        // Show all pages if 5 or fewer
                        [...Array(totalPages)].map((_, i) => (
                          <button
                            key={i + 1}
                            onClick={() => handlePageChange(i + 1)}
                            className={`px-3 py-1 rounded ${
                              currentPage === i + 1
                                ? "bg-white text-black"
                                : "bg-zinc-700 text-white hover:bg-zinc-600"
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))
                      ) : (
                        // Show limited pages with ellipsis for many pages
                        <>
                          {/* First page */}
                          {currentPage > 2 && (
                            <button
                              onClick={() => handlePageChange(1)}
                              className="px-3 py-1 rounded bg-zinc-700 text-white hover:bg-zinc-600"
                            >
                              1
                            </button>
                          )}

                          {/* Ellipsis if needed */}
                          {currentPage > 3 && (
                            <span className="px-3 py-1 text-zinc-400">...</span>
                          )}

                          {/* Current page and neighbors */}
                          {[...Array(5)].map((_, i) => {
                            const pageNum = Math.max(
                              1,
                              Math.min(currentPage - 2 + i, totalPages)
                            );
                            // Skip if this would create a duplicate with first/last page buttons
                            if (
                              (pageNum === 1 && currentPage <= 3) ||
                              (pageNum === totalPages &&
                                currentPage >= totalPages - 2)
                            ) {
                              return null;
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`px-3 py-1 rounded ${
                                  currentPage === pageNum
                                    ? "bg-blue-600 text-white"
                                    : "bg-zinc-700 text-white hover:bg-zinc-600"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}

                          {/* Ellipsis if needed */}
                          {currentPage < totalPages - 2 && (
                            <span className="px-3 py-1 text-zinc-400">...</span>
                          )}

                          {/* Last page */}
                          {currentPage < totalPages - 1 && (
                            <button
                              onClick={() => handlePageChange(totalPages)}
                              className="px-3 py-1 rounded bg-zinc-700 text-white hover:bg-zinc-600"
                            >
                              {totalPages}
                            </button>
                          )}
                        </>
                      )}
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded ${
                          currentPage === totalPages
                            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                            : "bg-zinc-700 text-white hover:bg-zinc-600"
                        }`}
                      >
                        Last
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
