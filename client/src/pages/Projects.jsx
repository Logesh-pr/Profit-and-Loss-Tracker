import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProjects } from "../config/fetch";
import axios from "axios";
import request from "../config/request";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

// UI components
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Breadcrumb from "../components/Breadcrumb";
import { FaSearch } from "react-icons/fa";
import { IoMdAdd } from "react-icons/io";

// Form validation schema
const projectSchema = yup.object({
  name: yup
    .string()
    .required("Project name is required")
    .min(3, "Project name must be at least 3 characters")
    .max(100, "Project name must be less than 100 characters"),
  description: yup
    .string()
    .max(500, "Description must be less than 500 characters"),
  client: yup.string().max(100, "Client name must be less than 100 characters"),
  status: yup
    .string()
    .oneOf(["Planning", "In Progress", "Completed"], "Invalid status")
    .required("Status is required"),
});

const Projects = () => {
  const [navbar, setNavbar] = useState(false);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: yupResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      client: "",
      status: "Planning",
    },
  });

  const handleNavbar = () => {
    setNavbar((prev) => !prev);
  };

  const { data, error, isLoading, isError } = useQuery({
    queryKey: ["projects"],
    queryFn: () => fetchProjects(),
    enabled: true,
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: (newProject) => {
      return axios.post(request.projects, newProject);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setShowForm(false);
      reset();
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: ({ id, updatedProject }) => {
      return axios.put(`${request.projects}/${id}`, updatedProject);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setShowForm(false);
      setEditingProject(null);
      reset();
    },
  });

  // Add delete project mutation after update mutation
  const deleteProjectMutation = useMutation({
    mutationFn: (projectId) => {
      return axios.delete(`${request.projects}/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["allData"] });
      queryClient.invalidateQueries({ queryKey: ["monthlyTrends"] });
    },
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "INR",
    }).format(value);
  };

  useEffect(() => {
    if (data?.data) {
      // Handle the new API structure from the updated ProjectController
      const projectsData = Array.isArray(data.data)
        ? data.data
        : data.data.data || [];

      // Make sure we convert the _id field to id for frontend consistency
      const formattedProjects = projectsData.map((project) => ({
        ...project,
        id: project._id || project.id, // Ensure id field exists
        inbound: project.inbound || 0,
        outbound: project.outbound || 0,
        profit:
          project.profit !== undefined
            ? project.profit
            : (project.inbound || 0) - (project.outbound || 0),
      }));

      setProjects(formattedProjects);
      setFilteredProjects(formattedProjects);
    }
  }, [data]);

  // Search functionality
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter((project) =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchTerm, projects]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProjects.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  const handleProjectClick = (id) => {
    navigate(`/projects/${id}`);
  };

  const handleAddProject = () => {
    setEditingProject(null);
    reset({
      name: "",
      description: "",
      client: "",
      status: "Planning",
    });
    setShowForm(true);
  };

  const handleEditProject = (project, e) => {
    e.stopPropagation(); // Prevent navigation to project details
    setEditingProject(project);
    setValue("name", project.name);
    setValue("description", project.description || "");
    setValue("client", project.client || "");
    setValue("status", project.status);
    setShowForm(true);
  };

  const handleDeleteProject = async (projectId, projectName, e) => {
    e.stopPropagation(); // Prevent navigation to project details
    if (
      window.confirm(
        `Are you sure you want to delete project "${projectName}"? This action cannot be undone.`
      )
    ) {
      try {
        await deleteProjectMutation.mutateAsync(projectId);
      } catch (error) {
        console.error("Error deleting project:", error);
        alert("Failed to delete project. Please try again.");
      }
    }
  };

  const onSubmit = (data) => {
    if (editingProject) {
      updateProjectMutation.mutate({
        id: editingProject.id,
        updatedProject: data,
      });
    } else {
      createProjectMutation.mutate(data);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingProject(null);
    reset();
  };

  return (
    <div className="container mx-auto px-4 min-h-[100vh] bg-black text-primary overflow-hidden">
      <Navbar handleNavbar={handleNavbar} navbar={navbar} />
      <div className="">
        <div className="grid grid-cols-12 md:grid-cols-12  md:gap-x-12 ">
          <div className="md:col-start-1 md:col-end-5 xl:col-start-1 xl:col-end-3">
            <Sidebar navbar={navbar} setNavbar={setNavbar} />
          </div>
          <div className="col-start-1 col-end-13 md:col-start-5 xl:col-start-3 md:col-end-13 ">
            <div className="  ">
              <div className="mt-4">
                <Breadcrumb />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white mt-4 mb-6">
                  Projects
                </h1>
                <button
                  onClick={handleAddProject}
                  className="flex items-center gap-2 bg-white hover:bg-gray-200 text-black px-4 py-2 rounded-md transition-colors cursor-pointer"
                >
                  <IoMdAdd className="text-lg" /> Add Project
                </button>
              </div>

              <div className=" space-y-6">
                {/* Project Form */}
                {showForm && (
                  <div className="bg-[#1d2125] p-6 rounded-lg mb-6 shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-white">
                      {editingProject ? "Edit Project" : "Add New Project"}
                    </h2>
                    <form
                      onSubmit={handleSubmit(onSubmit)}
                      className="space-y-4 text-white"
                    >
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Project Name*
                        </label>
                        <input
                          type="text"
                          {...register("name")}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                          placeholder="Enter project name"
                        />
                        {errors.name && (
                          <p className="text-red-400 text-sm mt-1">
                            {errors.name.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Description
                        </label>
                        <textarea
                          {...register("description")}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                          placeholder="Enter project description"
                          rows="3"
                        ></textarea>
                        {errors.description && (
                          <p className="text-red-400 text-sm mt-1">
                            {errors.description.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Client
                        </label>
                        <input
                          type="text"
                          {...register("client")}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                          placeholder="Enter client name"
                        />
                        {errors.client && (
                          <p className="text-red-400 text-sm mt-1">
                            {errors.client.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Status*
                        </label>
                        <select
                          {...register("status")}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white"
                        >
                          <option value="Planning">Planning</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                        {errors.status && (
                          <p className="text-red-400 text-sm mt-1">
                            {errors.status.message}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                          disabled={
                            createProjectMutation.isPending ||
                            updateProjectMutation.isPending
                          }
                        >
                          {createProjectMutation.isPending ||
                          updateProjectMutation.isPending
                            ? "Saving..."
                            : editingProject
                            ? "Update Project"
                            : "Create Project"}
                        </button>
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

                {isLoading ? (
                  <div className="text-white text-center">
                    Loading projects...
                  </div>
                ) : isError ? (
                  <div className="text-red-500 text-center">
                    Error loading projects: {error.message}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Search and pagination controls */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1d2125] p-4 rounded-lg">
                      <div className="relative w-full md:w-64">
                        <input
                          type="text"
                          placeholder="Search projects..."
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
                      <div className="flex items-center gap-2 text-sm text-zinc-400 w-full md:w-auto">
                        <span>Show</span>
                        <select
                          value={itemsPerPage}
                          onChange={handleItemsPerPageChange}
                          className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                        </select>
                        <span>entries</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto -mx-3 sm:mx-0 pb-2">
                      <div className="min-w-full inline-block align-middle px-3 sm:px-0">
                        <div className="min-w-[640px]">
                          <Table>
                            <TableCaption>
                              A list of your projects with financial summaries
                            </TableCaption>
                            <TableHeader>
                              <TableRow className="bg-zinc-800 border-zinc-700">
                                <TableHead className="whitespace-nowrap">
                                  Project Name
                                </TableHead>
                                <TableHead className="text-right whitespace-nowrap">
                                  Inbound
                                </TableHead>
                                <TableHead className="text-right whitespace-nowrap">
                                  Outbound
                                </TableHead>
                                <TableHead className="text-right whitespace-nowrap">
                                  Profit/Loss
                                </TableHead>
                                <TableHead className="text-right whitespace-nowrap">
                                  Actions
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {currentItems.length > 0 ? (
                                currentItems.map((project) => {
                                  const inbound = project.inbound || 0;
                                  const outbound = project.outbound || 0;
                                  const profit = inbound - outbound;
                                  const isProfit = profit >= 0;

                                  return (
                                    <TableRow
                                      key={project.id}
                                      className="text-white hover:bg-zinc-800 transition-colors"
                                    >
                                      <TableCell
                                        className="font-medium text-xs sm:text-sm cursor-pointer"
                                        onClick={() =>
                                          handleProjectClick(project.id)
                                        }
                                      >
                                        {project.name}
                                      </TableCell>
                                      <TableCell
                                        className="text-right text-green-400 text-xs sm:text-sm whitespace-nowrap"
                                        onClick={() =>
                                          handleProjectClick(project.id)
                                        }
                                      >
                                        {formatCurrency(inbound)}
                                      </TableCell>
                                      <TableCell
                                        className="text-right text-red-400 text-xs sm:text-sm whitespace-nowrap"
                                        onClick={() =>
                                          handleProjectClick(project.id)
                                        }
                                      >
                                        {formatCurrency(outbound)}
                                      </TableCell>
                                      <TableCell
                                        className={`text-right text-xs sm:text-sm whitespace-nowrap ${
                                          isProfit
                                            ? "text-green-400"
                                            : "text-red-400"
                                        }`}
                                        onClick={() =>
                                          handleProjectClick(project.id)
                                        }
                                      >
                                        {formatCurrency(profit)}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          <button
                                            onClick={(e) =>
                                              handleEditProject(project, e)
                                            }
                                            className="text-zinc-400 hover:text-white transition-colors"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            onClick={(e) =>
                                              handleDeleteProject(
                                                project.id,
                                                project.name,
                                                e
                                              )
                                            }
                                            className="text-zinc-400 hover:text-red-400 transition-colors"
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })
                              ) : (
                                <TableRow>
                                  <TableCell
                                    colSpan={4}
                                    className="h-24 text-center text-zinc-400"
                                  >
                                    {searchTerm
                                      ? "No projects found matching your search"
                                      : "No projects found. Create your first project!"}
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>

                    {/* Pagination controls */}
                    {filteredProjects.length > 0 && (
                      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#1d2125] p-4 rounded-lg text-sm">
                        <div className="text-zinc-400">
                          Showing {indexOfFirstItem + 1} to{" "}
                          {Math.min(indexOfLastItem, filteredProjects.length)}{" "}
                          of {filteredProjects.length} entries
                          {searchTerm && (
                            <span>
                              {" "}
                              (filtered from {projects.length} total entries)
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1">
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
                          {[...Array(totalPages)].map((_, i) => (
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
                          ))}
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
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projects;
