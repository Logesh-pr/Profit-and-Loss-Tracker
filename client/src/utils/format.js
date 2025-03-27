// Currency formatting
export const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Date formatting
export const formatDate = (dateString) => {
  if (!dateString) return "N/A";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";

    return new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
};

// Parse date string to ISO format
export const parseDate = (dateString) => {
  if (!dateString) return null;

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD format
  } catch (error) {
    console.error("Error parsing date:", error);
    return null;
  }
};

// Get current date in YYYY-MM-DD format
export const getCurrentDate = () => {
  return new Date().toISOString().split("T")[0];
};

// Format date for display in inputs
export const formatDateForInput = (dateString) => {
  if (!dateString) return getCurrentDate();

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return getCurrentDate();
    return date.toISOString().split("T")[0];
  } catch (error) {
    console.error("Error formatting date for input:", error);
    return getCurrentDate();
  }
};
