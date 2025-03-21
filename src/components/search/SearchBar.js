// ========================================
// SearchBar.js
// A modern search component with debouncing, caching, and accessibility features
// using Bulma styling and TMDB API integration
// ========================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchMovies, searchTvShows, EXCLUDED_TV_GENRES, EXCLUDED_MOVIE_GENRES } from '../../services/tmdb';
import { debounce } from '../../utils/helpers';
import '../../components/search/SearchBar.css';

// Title patterns to exclude
const EXCLUDED_TITLE_PATTERNS = [
	'behind the scenes', 'making of', 'special features', 'greatest hits',
	'extended edition', 'extended cut', 'director\'s cut', 'recap',
	'bloopers', 'gag reel', 'deleted scenes', 'bonus features',
	'commentary', 'featurette', 'documentary', 'interviews',
	'bts', 'extras', 'outtakes', 'promotional', 'promo',
	'trailer', 'teaser', 'sneak peek', 'preview',
	'anniversary edition', 'special edition', 'collector\'s edition',
	'unrated', 'alternate ending', 'alternate version'
];

// Helper function to check if title should be excluded
const shouldExcludeTitle = (title) => {
	if (!title) return true;
	const lowerTitle = title.toLowerCase();
	return EXCLUDED_TITLE_PATTERNS.some(pattern => lowerTitle.includes(pattern.toLowerCase()));
};

// Helper function to check if genre should be excluded
const hasExcludedGenre = (genreIds, mediaType) => {
	if (!genreIds || !Array.isArray(genreIds)) return false;
	const excludedGenres = mediaType === 'tv' ? EXCLUDED_TV_GENRES : EXCLUDED_MOVIE_GENRES;
	return genreIds.some(id => excludedGenres.includes(id));
};

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
	const searchRef  = useRef(null);
	const resultsRef = useRef(null);
	const cache      = useRef(new Map());
	const navigate   = useNavigate();

	// ========================================
	// Search Result Scoring
	// ========================================

	const calculateSearchScore = (result) => {
		const currentYear = new Date().getFullYear();
		const releaseDate = result.release_date || result.first_air_date;
		const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : currentYear;

		// Weighted user rating (from NotableWorksManager logic)
		const MIN_VOTES      = 1000;
		const AVG_RATING     = 7.0;
		const voteWeight     = Math.min(result.vote_count / MIN_VOTES, 1);
		const weightedRating = (voteWeight * result.vote_average + (1 - voteWeight) * AVG_RATING) *
							(1 + Math.log10(Math.max(result.vote_count / MIN_VOTES, 1)));

		// Popularity score
		const popularityScore = Math.min(Math.log10(result.popularity + 1) / 3, 1);

		// Vote count score
		const voteCountScore = Math.min(Math.log10(Math.max(result.vote_count, 1)) / 7, 1);

		// Recency score
		const years        = (currentYear - releaseYear);
		const recencyScore = Math.max(0, 1 - (years / 50));

		// Weighting
		const weights = {
			userRating: 4.0,
			popularity: 2.0,
			voteCount : 2.0,
			recency   : 0
		};

		// Calculate final score
		return (
			weightedRating * weights.userRating +
			popularityScore * weights.popularity +
			voteCountScore * weights.voteCount +
			recencyScore * weights.recency
		);
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

				// Search both movies and TV shows
				const [movieResults, tvResults] = await Promise.all([
					searchMovies(searchQuery),
					searchTvShows(searchQuery)
				]);

				// Process and combine results
				const combinedResults = [
					...movieResults
						.filter(movie => 
							movie.original_language === 'en' && 
							!shouldExcludeTitle(movie.title) &&
							!hasExcludedGenre(movie.genre_ids, 'movie') &&
							movie.poster_path // Ensure image exists
						)
						.map(movie => ({ ...movie, media_type: 'movie' })),
					...tvResults
						.filter(show => 
							show.original_language === 'en' && 
							!shouldExcludeTitle(show.name) &&
							!hasExcludedGenre(show.genre_ids, 'tv') &&
							show.poster_path // Ensure image exists
						)
						.map(show => ({ 
							...show, 
							media_type: 'tv',
							title: show.name,
							release_date: show.first_air_date
						}))
				];

				// Group items by collection if they belong to one
				const collections = new Map();
				const nonCollectionItems = [];

				combinedResults.forEach(item => {
					if (item.belongs_to_collection) {
						const collection = collections.get(item.belongs_to_collection.id) || {
							id: item.belongs_to_collection.id,
							name: item.belongs_to_collection.name,
							items: [],
							earliest_date: null
						};
						collection.items.push(item);
						
						// Track the earliest date in the collection
						const itemDate = new Date(item.release_date || item.first_air_date || '0');
						if (!collection.earliest_date || itemDate < collection.earliest_date) {
							collection.earliest_date = itemDate;
						}
						
						collections.set(item.belongs_to_collection.id, collection);
					} else {
						nonCollectionItems.push(item);
					}
				});

				// Sort collection items chronologically
				collections.forEach(collection => {
					collection.items.sort((a, b) => {
						const dateA = new Date(a.release_date || a.first_air_date || '0');
						const dateB = new Date(b.release_date || b.first_air_date || '0');
						return dateA - dateB;
					});
				});

				// Convert collections to array and sort by earliest date
				const sortedCollections = Array.from(collections.values())
					.sort((a, b) => a.earliest_date - b.earliest_date)
					.flatMap(collection => collection.items);

				// Calculate scores only for non-collection items
				const scoredNonCollectionItems = nonCollectionItems
					.map(item => ({
						...item,
						score: calculateSearchScore(item)
					}))
					.sort((a, b) => b.score - a.score);

				// Combine results with collections first, followed by scored individual items
				const finalResults = [...sortedCollections, ...scoredNonCollectionItems];

				// Cache the results
				cache.current.set(searchQuery, finalResults);
				setResults(finalResults);
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
					handleResultClick(results[selectedIndex]);
				} else if (query.trim() && results.length > 0) {
					handleResultClick(results[0]);
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

	const handleResultClick = (result) => {
		navigate(`/${result.media_type}/${result.id}`);
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
					ref                   = {searchRef}
					className             = {`search-input ${isLoading ? 'is-loading' : ''}`}
					type                  = "text"
					placeholder           = "Search movies & TV shows..."
					value                 = {query}
					onChange              = {handleInputChange}
					onKeyDown             = {handleKeyDown}
					onFocus               = {() => setIsFocused(true)}
					onBlur                = {() => setTimeout(() => setIsFocused(false), 200)}
					aria-label            = "Search movies and TV shows"
					aria-controls         = "search-results"
					aria-activedescendant = {selectedIndex >= 0 ? `result-${selectedIndex}` : undefined}
				/>
				{isLoading ? (
					<div className="search-loading">
						<div className="loading-spinner"></div>
					</div>
				) : (
					<svg
						className      = "search-icon"
						xmlns          = "http://www.w3.org/2000/svg"
						viewBox        = "0 0 24 24"
						width          = "16"
						height         = "16"
						fill           = "none"
						stroke         = "currentColor"
						strokeWidth    = "2"
						strokeLinecap  = "round"
						strokeLinejoin = "round"
					>
						<circle cx="11" cy="11" r="8" />
						<line x1="21" y1="21" x2="16.65" y2="16.65" />
					</svg>
				)}
			</div>

			{/* Search Results Dropdown */}
			{results.length > 0 && isFocused && (
				<div
					className = "search-results"
					id        = "search-results"
					role      = "listbox"
				>
					{results.map((result, index) => (
						<div
							key           = {result.id}
							className     = {`search-result ${index === selectedIndex ? 'is-selected' : ''}`}
							onClick       = {() => handleResultClick(result)}
							role          = "option"
							id            = {`result-${index}`}
							aria-selected = {index === selectedIndex}
						>
							{result.poster_path && (
								<img
									src       = {`https://image.tmdb.org/t/p/w92${result.poster_path}`}
									alt       = {result.title}
									className = "search-result-poster"
									loading   = "lazy"
								/>
							)}
							<div className="search-result-info">
								<div className="search-result-title">
									{result.title}
									{(result.release_date || result.first_air_date) && (
										<span className="search-result-year">
											({new Date(result.release_date || result.first_air_date).getFullYear()})
										</span>
									)}
									<span className="search-result-type">
										{result.media_type === 'tv' ? 'TV Show' : 'Movie'}
									</span>
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