import request from "./request";

import axios from "axios";

// Mock data for projects
const mockProjects = [
  {
    id: "1",
    name: "Website Redesign",
    inbound: 5000,
    outbound: 3200,
    createdAt: "2023-01-15T00:00:00.000Z",
    status: "Completed",
  },
  {
    id: "2",
    name: "Mobile App Development",
    inbound: 12000,
    outbound: 8500,
    createdAt: "2023-03-10T00:00:00.000Z",
    status: "In Progress",
  },
  {
    id: "3",
    name: "Marketing Campaign",
    inbound: 3500,
    outbound: 4200,
    createdAt: "2023-02-05T00:00:00.000Z",
    status: "Completed",
  },
  {
    id: "4",
    name: "Product Launch",
    inbound: 0,
    outbound: 2800,
    createdAt: "2023-04-01T00:00:00.000Z",
    status: "Planning",
  },
];

// Mock project details
const mockProjectDetails = {
  1: {
    id: "1",
    name: "Website Redesign",
    description: "Complete redesign of company website with new branding",
    client: "ABC Corporation",
    createdAt: "2023-01-15T00:00:00.000Z",
    status: "Completed",
    transactions: [
      {
        id: "t1",
        date: "2023-01-20T00:00:00.000Z",
        description: "Initial payment",
        type: "inbound",
        amount: 2000,
      },
      {
        id: "t2",
        date: "2023-01-25T00:00:00.000Z",
        description: "UI design cost",
        type: "outbound",
        amount: 1200,
      },
      {
        id: "t3",
        date: "2023-02-10T00:00:00.000Z",
        description: "Development cost",
        type: "outbound",
        amount: 2000,
      },
      {
        id: "t4",
        date: "2023-02-28T00:00:00.000Z",
        description: "Final payment",
        type: "inbound",
        amount: 3000,
      },
    ],
  },
  2: {
    id: "2",
    name: "Mobile App Development",
    description: "Developing a new mobile app for customer engagement",
    client: "XYZ Inc.",
    createdAt: "2023-03-10T00:00:00.000Z",
    status: "In Progress",
    transactions: [
      {
        id: "t5",
        date: "2023-03-15T00:00:00.000Z",
        description: "Project deposit",
        type: "inbound",
        amount: 5000,
      },
      {
        id: "t6",
        date: "2023-03-20T00:00:00.000Z",
        description: "UI/UX design",
        type: "outbound",
        amount: 3500,
      },
      {
        id: "t7",
        date: "2023-04-05T00:00:00.000Z",
        description: "Backend development",
        type: "outbound",
        amount: 5000,
      },
      {
        id: "t8",
        date: "2023-04-15T00:00:00.000Z",
        description: "Milestone payment",
        type: "inbound",
        amount: 7000,
      },
    ],
  },
  3: {
    id: "3",
    name: "Marketing Campaign",
    description: "Social media and email marketing campaign for product launch",
    client: "123 Enterprises",
    createdAt: "2023-02-05T00:00:00.000Z",
    status: "Completed",
    transactions: [
      {
        id: "t9",
        date: "2023-02-10T00:00:00.000Z",
        description: "Initial payment",
        type: "inbound",
        amount: 3500,
      },
      {
        id: "t10",
        date: "2023-02-15T00:00:00.000Z",
        description: "Content creation",
        type: "outbound",
        amount: 1500,
      },
      {
        id: "t11",
        date: "2023-02-25T00:00:00.000Z",
        description: "Ad spend",
        type: "outbound",
        amount: 2700,
      },
    ],
  },
  4: {
    id: "4",
    name: "Product Launch",
    description: "Launch event for new product line",
    client: "Acme Corp",
    createdAt: "2023-04-01T00:00:00.000Z",
    status: "Planning",
    transactions: [
      {
        id: "t12",
        date: "2023-04-10T00:00:00.000Z",
        description: "Venue booking",
        type: "outbound",
        amount: 1500,
      },
      {
        id: "t13",
        date: "2023-04-15T00:00:00.000Z",
        description: "Marketing materials",
        type: "outbound",
        amount: 1300,
      },
    ],
  },
};

const fetchAllData = (dateParams = {}) => {
  const { month, day, year } = dateParams;
  let url = request.allData;

  // Only add date parameters if at least one is provided
  if (Object.keys(dateParams).length > 0 && (month || day || year)) {
    url += "?";
    const params = [];

    // Convert to startDate and endDate parameters that the API expects
    if (year && month && day) {
      // If we have full date, create a single day range
      const dateStr = `${year}-${month.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}`;
      params.push(`startDate=${dateStr}`);
      params.push(`endDate=${dateStr}`);
    } else if (year && month) {
      // If we have year and month, create a month range
      const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0).getDate(); // Get last day of month
      const endDate = `${year}-${month.toString().padStart(2, "0")}-${lastDay}`;
      params.push(`startDate=${startDate}`);
      params.push(`endDate=${endDate}`);
    } else if (year) {
      // If we have just year, create a year range
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      params.push(`startDate=${startDate}`);
      params.push(`endDate=${endDate}`);
    }

    if (params.length > 0) {
      url += params.join("&");
    }
  }

  return axios.get(url);
};

/**
 * Fetch all projects from the API
 * @returns {Promise<Object>} The API response with project data
 */
const fetchProjects = async () => {
  try {
    const response = await axios.get(request.projects);

    return {
      data: response.data.data || response.data,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error.message,
    };
  }
};

const fetchProjectDetails = (projectId, params = {}) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    type = "",
    sortBy = "date",
    sortOrder = "desc",
  } = params;

  // Build query string
  const queryParams = new URLSearchParams();
  queryParams.append("page", page);
  queryParams.append("limit", limit);

  if (search) queryParams.append("search", search);
  if (type) queryParams.append("type", type);
  if (sortBy) queryParams.append("sortBy", sortBy);
  if (sortOrder) queryParams.append("sortOrder", sortOrder);

  const url = `${request.projectDetails(projectId)}?${queryParams.toString()}`;

  return axios.get(url);

  // Comment out mock data
  // return Promise.resolve({ data: mockProjectDetails[projectId] || {} });
};
export { fetchAllData, fetchProjects, fetchProjectDetails };
