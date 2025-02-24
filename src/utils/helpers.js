// src/utils/helpers.js

// Function to format dates as "Feb 2025" instead of "10/02/2025"
export const formatReleaseDate = (dateString) => {
    if (!dateString) return 'Unknown'; // Handle cases where date might be missing
    return new Date(dateString).toLocaleDateString('en-US', {
      // month: 'short',
      year: 'numeric',
    });
  };