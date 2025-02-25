// src/utils/helpers.js

// Function to format dates based on the specified format (e.g., "YYYY", "mmm YYYY", "dd/mm/yy", etc.)
export const formatDate = (dateString, format = "mmm YYYY") => {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  const options = {};

  switch (format) {
    case "YYYY":
      return date.getFullYear().toString();
    case "mmm YYYY":
      options.month = "short";
      options.year = "numeric";
      break;
    case "dd/mm/yy":
      return date.toLocaleDateString("en-GB").split("/").slice(0, 3).join("/");
    case "dd Mon YYYY":
      options.day = "2-digit";
      options.month = "short";
      options.year = "numeric";
      break;
    default:
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }
  return date.toLocaleDateString("en-US", options);
};

// Function to calculate age based on a reference date
export const calculateAge = (birthdate, referenceDate) => {
  if (!birthdate) return "Unknown";
  const birthYear = parseInt(birthdate.split("-")[0], 10);
  const referenceYear = parseInt(referenceDate.split("-")[0], 10);
  return referenceYear - birthYear;
};

// Function to format currency to be "$120m USD"
export const formatCurrency = (amount) => {
  if (!amount || amount < 0) return "N/A";
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(0)}b USD`;
  } else if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(0)}m USD`;
  } else {
    return `$${amount.toLocaleString()} USD`;
  }
};
