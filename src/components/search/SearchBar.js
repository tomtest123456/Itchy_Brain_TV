// ========================================
// SearchBar.js
// A modern search component with debouncing, caching, and accessibility features
// using Bulma styling and TMDB API integration
// ========================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchMovies } from '../../services/tmdb';
import { debounce } from '../../utils/helpers';
import './SearchBar.css';

/**
 * SearchBar Component
 * Provides a search interface with instant results, keyboard navigation,
 * and mobile responsiveness
 */
const SearchBar = ({ isLarge = false }) => {
	// ========================================
	// State Management
	// ========================================
	const [query, setQuery] = useState('');
	const [results, setResults] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const [isFocused, setIsFocused] = useState(false);

	// Refs for DOM elements and cache
	const searchRef = useRef(null);
	const resultsRef = useRef(null);
	const cache = useRef(new Map());
	const navigate = useNavigate();

	// ========================================
	// Search Result Sorting
	// ========================================

	const calculateMovieScore = (movie) => {
		const currentYear = new Date().getFullYear();
		const movieYear = movie.release_date ? new Date(movie.release_date).getFullYear() : currentYear;

		// Base score from TMDB's natural search ranking (reverse index order)
		const relevanceScore = 1 / (movie.index + 1);

		// Popularity score (normalized)
		const popularityScore = movie.popularity ? movie.popularity / 100 : 0;

		// Rating score (normalized to 0-1)
		const ratingScore = movie.vote_average ? movie.vote_average / 10 : 0;

		// Vote count score (logarithmic scale to prevent extreme numbers from dominating)
		const voteCountScore = movie.vote_count ? Math.log10(movie.vote_count) / 6 : 0;

		// Recency score (exponential decay)
		const yearsOld = currentYear - movieYear;
		const recencyScore = Math.exp(-yearsOld / 10); // Decay factor of 10 years

		// Classic movie bonus (for movies over 25 years old with high ratings)
		const isClassic = yearsOld > 25 && movie.vote_average >= 7.5;
		const classicBonus = isClassic ? 0.5 : 0;

		// Weight factors (adjust these to change importance of each factor)
		const weights = {
			relevance: 1.5,   // High weight for TMDB's own ranking
			popularity: 1.2,  // Strong factor but not dominant
			rating: 1.0,     // Important but not as much as popularity
			voteCount: 0.8,  // Meaningful but not dominant
			recency: 0.7,    // Moderate importance
			classic: 0.5     // Small bonus for classics
		};

		// Calculate final score
		const score = (
			relevanceScore * weights.relevance +
			popularityScore * weights.popularity +
			ratingScore * weights.rating +
			voteCountScore * weights.voteCount +
			recencyScore * weights.recency +
			classicBonus * weights.classic
		);

		return score;
	};

	// ========================================
	// Search Functionality
	// ========================================

	// Debounced search function
	const debouncedSearch = useCallback(
		debounce(async (searchQuery) => {
			if (searchQuery.length < 2) {
				setResults([]);
				return;
			}

			setIsLoading(true);
			setError(null);

			try {
				// Check cache first
				if (cache.current.has(searchQuery)) {
					setResults(cache.current.get(searchQuery));
					setIsLoading(false);
					return;
				}

				const searchResults = await searchMovies(searchQuery);

				// Add index for relevance scoring and calculate scores
				const resultsWithScores = searchResults.map((movie, index) => ({
					...movie,
					index,
					score: calculateMovieScore({ ...movie, index })
				}));

				// Sort by score
				const sortedResults = resultsWithScores.sort((a, b) => b.score - a.score);

				// Cache the sorted results
				cache.current.set(searchQuery, sortedResults);
				setResults(sortedResults);
			} catch (err) {
				console.error('Search error:', err);
				setError('Failed to fetch search results. Please try again.');
				setResults([]);
			} finally {
				setIsLoading(false);
			}
		}, 300),
		[]
	);

	// Update search results when query changes
	useEffect(() => {
		if (query.trim()) {
			debouncedSearch(query);
		} else {
			setResults([]);
		}
	}, [query, debouncedSearch]);

	// ========================================
	// Keyboard Navigation
	// ========================================

	const handleKeyDown = (e) => {
		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				setSelectedIndex(prev =>
					prev < results.length - 1 ? prev + 1 : prev
				);
				break;
			case 'ArrowUp':
				e.preventDefault();
				setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
				break;
			case 'Enter':
				e.preventDefault();
				if (selectedIndex >= 0 && results[selectedIndex]) {
					handleResultClick(results[selectedIndex].id);
				} else if (query.trim() && results.length > 0) {
					handleResultClick(results[0].id);
				}
				break;
			case 'Escape':
				e.preventDefault();
				handleClear();
				break;
			default:
				break;
		}
	};

	// ========================================
	// Event Handlers
	// ========================================

	const handleInputChange = (e) => {
		setQuery(e.target.value);
		setSelectedIndex(-1);
	};

	const handleClear = () => {
		setQuery('');
		setResults([]);
		setSelectedIndex(-1);
		if (searchRef.current) {
			searchRef.current.focus();
		}
	};

	const handleResultClick = (movieId) => {
		navigate(`/movie/${movieId}`);
		handleClear();
	};

	// Close results when clicking outside
	useEffect(() => {
		const handleClickOutside = (e) => {
			if (resultsRef.current && !resultsRef.current.contains(e.target) &&
				searchRef.current && !searchRef.current.contains(e.target)) {
				setResults([]);
				setSelectedIndex(-1);
				setIsFocused(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// ========================================
	// Component Render
	// ========================================

	return (
		<div className={`search-container ${isLarge ? 'is-large' : ''}`} ref={resultsRef}>
			<div className="search-input-wrapper">
				<input
					ref={searchRef}
					className={`search-input ${isLoading ? 'is-loading' : ''}`}
					type="text"
					placeholder="Search movies..."
					value={query}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setTimeout(() => setIsFocused(false), 200)}
					aria-label="Search movies"
					aria-controls="search-results"
					aria-activedescendant={selectedIndex >= 0 ? `result-${selectedIndex}` : undefined}
				/>
				{isLoading ? (
					<div className="search-loading">
						<div className="loading-spinner"></div>
					</div>
				) : (
					<svg
						className="search-icon"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						width="16"
						height="16"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<circle cx="11" cy="11" r="8" />
						<line x1="21" y1="21" x2="16.65" y2="16.65" />
					</svg>
				)}
			</div>

			{/* Search Results Dropdown */}
			{results.length > 0 && isFocused && (
				<div
					className="search-results"
					id="search-results"
					role="listbox"
				>
					{results.map((movie, index) => (
						<div
							key={movie.id}
							className={`search-result ${index === selectedIndex ? 'is-selected' : ''}`}
							onClick={() => handleResultClick(movie.id)}
							role="option"
							id={`result-${index}`}
							aria-selected={index === selectedIndex}
						>
							{movie.poster_path && (
								<img
									src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
									alt={movie.title}
									className="search-result-poster"
									loading="lazy"
								/>
							)}
							<div className="search-result-info">
								<div className="search-result-title">
									{movie.title}
									{movie.release_date && (
										<span className="search-result-year">
											({new Date(movie.release_date).getFullYear()})
										</span>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Error Message */}
			{error && (
				<div className="notification is-danger is-light">
					{error}
				</div>
			)}
		</div>
	);
};

export default SearchBar;