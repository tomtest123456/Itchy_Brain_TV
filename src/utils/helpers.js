// src/utils/helpers.js

// Function to format dates based on the specified format (e.g., "YYYY", "mmm YYYY", "dd/mm/yy", etc.)
export const formatDate = (dateString, format = "mmm YYYY") => {
	if (!dateString) return "Unknown";
	const date = new Date(dateString);
	const options = {};

	switch (format) {
		case "YYYY":
			return date.getFullYear().toString();
		case "YY":
			return `'${date.getFullYear().toString().slice(2)}`;
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
		case "ddth Mon YYYY": {
			const day = date.getDate(); // Get full numeric day (e.g., 23)
			const month = date.toLocaleString("en-GB", { month: "short" }); // Ensure correct locale
			const year = date.getFullYear();

			// Determine ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
			const suffix = (day % 10 === 1 && day !== 11) ? "st"
				: (day % 10 === 2 && day !== 12) ? "nd"
					: (day % 10 === 3 && day !== 13) ? "rd"
						: "th";

			return `${day}${suffix} ${month} ${year}`;
		}
		default:
			return date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
	}
	return date.toLocaleDateString("en-GB", options);
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

// Function to format a date range for collections (e.g., '01-'11)
export const formatDateRange = (startDate, endDate) => {
	if (!startDate || !endDate) return "";
	const startYear = new Date(startDate).getFullYear().toString().slice(2);
	const endYear = new Date(endDate).getFullYear().toString().slice(2);
	return `'${startYear}-'${endYear}`;
};

// Function to format year with apostrophe (e.g., '17)
export const formatYearWithApostrophe = (dateString) => {
	if (!dateString) return "";
	const year = new Date(dateString).getFullYear().toString();
	return `'${year.slice(2)}`;
};
