// ========================================
// RatingCircle.js
// A circular progress component that displays rating scores
// with color-coded progress bars based on the rating value
// ========================================

import React from 'react';
import './RatingCircle.css';

/**
 * Get color based on rating value and rating type
 * @param {number} value - Rating value
 * @param {string} type - Rating type (imdb, metacritic, or rottenTomatoes)
 * @returns {string} - Hex color code
 */
const getRatingColor = (value, type) => {
    // Use different thresholds for IMDb (0-10) vs percentage-based ratings (0-100)
    const normalizedValue = type === 'imdb' ? value * 10 : value;

    if (normalizedValue < 40) return '#D32F2F';      // Red - Very Bad
    if (normalizedValue < 60) return '#D88200';      // Orange - Below Average
    if (normalizedValue < 75) return '#E8CC15';      // Yellow - Mixed Reviews
    if (normalizedValue < 90) return '#89BA51';      // Light Green - Good
    return '#2CC131';                                // Green - Excellent
};

/**
 * Format display value based on rating type
 * @param {number} value - Rating value
 * @param {string} type - Rating type
 * @returns {string} - Formatted display value
 */
const formatDisplayValue = (value, type) => {
    // Always display as percentage
    const percentage = type === 'imdb' ? Math.round(value * 10) : Math.round(value);
    return `${percentage}%`;
};

/**
 * RatingCircle Component
 * Displays a circular progress bar with a rating value
 */
const RatingCircle = ({ value, type, size = 60 }) => {
    // Ensure value is a number
    const numericValue = Number(value) || 0;

    // Handle different rating scales
    const normalizedValue = type === 'imdb'
        ? Math.min(Math.max(numericValue, 0), 10)  // IMDb: 0-10
        : Math.min(Math.max(numericValue, 0), 100); // Others: 0-100

    // Calculate percentage for circle progress
    const percentage = type === 'imdb'
        ? (normalizedValue * 10) // Convert IMDb rating to percentage
        : normalizedValue;

    // Calculate circle properties
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const color = getRatingColor(normalizedValue, type);

    return (
        <div className="rating-circle" style={{ width: size, height: size }}>
            <svg className="rating-circle-svg" width={size} height={size}>
                {/* Background circle */}
                <circle
                    className="rating-circle-bg"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <circle
                    className="rating-circle-progress"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: strokeDashoffset,
                        stroke: color
                    }}
                />
            </svg>
            <div className="rating-circle-text">
                {formatDisplayValue(normalizedValue, type)}
            </div>
        </div>
    );
};

export default RatingCircle; 