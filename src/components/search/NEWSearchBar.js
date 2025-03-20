// ========================================
// SearchBar.js
// This component provides a dynamic search bar that queries the TMDB API for movies, TV shows, and actors.
// It uses debounced input to minimize API calls, filters out unwanted genres and non-English content,
// handles movie collections in chronological order, and applies weighted scoring for relevance.
// ========================================

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import debounce from "lodash.debounce";
import {
  searchMovies,
  searchTvShows,
  searchPeople,
  fetchCollectionDetails,
  fetchPersonMovieCredits,
  fetchPersonTvCredits,
  EXCLUDED_MOVIE_GENRES,
  EXCLUDED_TV_GENRES,
} from "../../services/tmdb";
import "./SearchBar.css";

/**
 * Computes a weighted score for an item based on several factors:
 * - Exact match boost if the title/name starts with the query
 * - Popularity (if available)
 * - Vote average multiplied by vote count (if available)
 * - For actors, includes their total credits count
 *
 * @param {object} item - A movie, TV show, or person object
 * @param {string} query - The search query
 * @returns {number} - The computed score
 */
const scoreItem = (item, query) => {
  let score = 0;
  const title = (item.title || item.name || "").toLowerCase();
  const lowerQuery = query.toLowerCase();

  // Exact match boosting
  if (title.startsWith(lowerQuery)) {
    score += 50;
  }

  // Add popularity
  if (item.popularity) {
    score += item.popularity;
  }

  // Add vote quality for movies/shows
  if (item.vote_average && item.vote_count) {
    score += item.vote_average * Math.log10(item.vote_count + 1);
  }

  // Add credit count for actors
  if (item.resultType === "Person" && item.totalCredits) {
    score += Math.log10(item.totalCredits + 1) * 10;
  }

  return score;
};

/**
 * Fetches and processes a movie collection, returning all released movies in chronological order
 * @param {number} collectionId - The ID of the collection to fetch
 * @returns {Promise<Array>} - Array of movies in the collection, sorted by release date
 */
const processCollection = async (collectionId) => {
  try {
    console.log(`Fetching collection ${collectionId}`);
    const collection = await fetchCollectionDetails(collectionId);
    if (!collection || !collection.parts) {
      console.log(`No collection found for ID ${collectionId}`);
      return [];
    }

    const now = new Date();
    const releasedMovies = collection.parts
      .filter(movie => {
        const releaseDate = new Date(movie.release_date);
        const hasMinimumRatings = movie.vote_count >= 100 && movie.vote_average >= 5.0;
        return movie.release_date && releaseDate <= now && hasMinimumRatings;
      })
      .sort((a, b) => new Date(a.release_date) - new Date(b.release_date));

    console.log(`Collection ${collectionId} processed:`, {
      total: collection.parts.length,
      released: releasedMovies.length,
      movies: releasedMovies.map(m => ({ title: m.title, date: m.release_date }))
    });

    return releasedMovies.map(movie => ({ 
      ...movie, 
      resultType: "Movie",
      inCollection: true,
      collectionId 
    }));
  } catch (error) {
    console.error("Error fetching collection:", error);
    return [];
  }
};

/**
 * Fetches total credits for a person from both movies and TV shows
 * @param {object} person - The person object to fetch credits for
 * @returns {Promise<number>} - Total number of credits
 */
const fetchPersonTotalCredits = async (person) => {
  try {
    const [movieCredits, tvCredits] = await Promise.all([
      fetchPersonMovieCredits(person.id),
      fetchPersonTvCredits(person.id)
    ]);

    const totalCredits = 
      (movieCredits?.cast?.length || 0) + 
      (movieCredits?.crew?.length || 0) +
      (tvCredits?.cast?.length || 0) + 
      (tvCredits?.crew?.length || 0);

    console.log(`Credits for ${person.name}:`, { totalCredits });
    return totalCredits;
  } catch (error) {
    console.error(`Error fetching credits for ${person.name}:`, error);
    return 0;
  }
};

/**
 * SearchBar Component
 * - Provides an input field for searching movies, TV shows, and actors.
 * - Executes debounced API calls (300ms delay) to fetch results in parallel.
 * - Filters for English-language content and handles movie collections.
 * - Applies weighted scoring to re-sort results by notability.
 * - Displays results in a unified dropdown list.
 */
const SearchBar = () => {
  // ========================================
  // State Management
  // ========================================
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const searchContainerRef = useRef(null);

  // ========================================
  // Click Outside Handler
  // ========================================
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsDropdownVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ========================================
  // Debounced API Search Function with Enhanced Filtering
  // ========================================
  const debouncedSearch = useCallback(
    debounce(async (searchTerm) => {
      if (!searchTerm.trim()) {
        setResults([]);
        setIsDropdownVisible(false);
        return;
      }
      try {
        console.log("Starting search for:", searchTerm);
        setLoading(true);
        setError("");

        // Fetch initial results
        const [movies, tvShows, people] = await Promise.all([
          searchMovies(searchTerm).catch(err => {
            console.error("Movie search failed:", err);
            return [];
          }),
          searchTvShows(searchTerm).catch(err => {
            console.error("TV show search failed:", err);
            return [];
          }),
          searchPeople(searchTerm).catch(err => {
            console.error("People search failed:", err);
            return { results: [] };
          })
        ]);

        // Filter movies: English language, ratings, and unwanted genres
        const filteredMovies = movies.filter(
          (movie) =>
            movie.genre_ids &&
            !movie.genre_ids.some((id) => EXCLUDED_MOVIE_GENRES.includes(id)) &&
            (movie.original_language === "en" || movie.language === "en") &&
            movie.vote_count >= 100 &&
            movie.vote_average >= 5.0
        );

        // Process collections
        const collectionMovies = [];
        const processedCollections = new Set();
        
        for (const movie of filteredMovies) {
          if (movie.belongs_to_collection && !processedCollections.has(movie.belongs_to_collection.id)) {
            processedCollections.add(movie.belongs_to_collection.id);
            const collectionResults = await processCollection(movie.belongs_to_collection.id);
            collectionMovies.push(...collectionResults);
          }
        }

        // Combine movies, maintaining collection order
        const allMovies = [];
        const seenMovieIds = new Set();

        // First add collection movies in chronological order
        collectionMovies.forEach(movie => {
          if (!seenMovieIds.has(movie.id)) {
            seenMovieIds.add(movie.id);
            allMovies.push(movie);
          }
        });

        // Then add non-collection movies
        filteredMovies
          .filter(movie => !seenMovieIds.has(movie.id))
          .forEach(movie => {
            seenMovieIds.add(movie.id);
            allMovies.push({ ...movie, resultType: "Movie" });
          });

        // Filter TV shows: English language, ratings, and unwanted genres
        const filteredTvShows = tvShows.filter(
          (tv) =>
            tv.genre_ids &&
            !tv.genre_ids.some((id) => EXCLUDED_TV_GENRES.includes(id)) &&
            (tv.original_language === "en" || tv.language === "en") &&
            tv.vote_count >= 100 &&
            tv.vote_average >= 5.0
        ).map(tv => ({ ...tv, resultType: "TV Show" }));

        // Process people results with credit counts
        const peopleData = await Promise.all(
          (people.results ? people.results : people).map(async person => {
            const totalCredits = await fetchPersonTotalCredits(person);
            return { 
              ...person, 
              resultType: "Person",
              totalCredits 
            };
          })
        );

        // Sort non-collection results by score
        const nonCollectionResults = [
          ...filteredTvShows,
          ...peopleData
        ].sort((a, b) => scoreItem(b, searchTerm) - scoreItem(a, searchTerm));

        // Combine all results, preserving collection order
        const allResults = [...allMovies, ...nonCollectionResults].slice(0, 15);

        console.log("Final results:", {
          total: allResults.length,
          movies: allResults.filter(r => r.resultType === "Movie").length,
          tvShows: allResults.filter(r => r.resultType === "TV Show").length,
          people: allResults.filter(r => r.resultType === "Person").length
        });

        setResults(allResults);
        setIsDropdownVisible(true);
      } catch (err) {
        console.error("Search error details:", { message: err.message, stack: err.stack });
        setError("Failed to load search results. Please try again.");
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  // ========================================
  // Effect to Trigger Search on Query Change
  // ========================================
  useEffect(() => {
    debouncedSearch(query);
    return () => {
      debouncedSearch.cancel();
    };
  }, [query, debouncedSearch]);

  // ========================================
  // Event Handlers
  // ========================================
  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleInputFocus = () => {
    if (query && results.length > 0) {
      setIsDropdownVisible(true);
    }
  };

  // ========================================
  // Render Function
  // ========================================
  return (
    <div className="search-container" ref={searchContainerRef} style={{ margin: '0' }}>
      <div className="search-input-wrapper">
        <input
          type="text"
          className={`search-input ${loading ? 'is-loading' : ''}`}
          placeholder="NEW .JS: Search movies, TV shows, actors..."
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
        />
        {loading && (
          <div className="search-loading">
            <div className="loading-spinner"></div>
          </div>
        )}
      </div>

      {error && <div className="notification is-danger">{error}</div>}

      {isDropdownVisible && query && results.length > 0 && (
        <div className="search-results">
          {results.map((item) => (
            <Link
              key={item.id}
              to={
                item.resultType === "Movie"
                  ? `/movie/${item.id}`
                  : item.resultType === "TV Show"
                  ? `/tv/${item.id}`
                  : `/person/${item.id}`
              }
              className="search-result"
            >
              {item.poster_path || item.profile_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w92${item.poster_path || item.profile_path}`}
                  alt={item.title || item.name}
                  className="search-result-poster"
                />
              ) : (
                <div className="search-result-poster" />
              )}
              <div className="search-result-info">
                <div className="search-result-title">
                  {item.title || item.name}
                  {(item.release_date || item.first_air_date) && (
                    <span className="search-result-year">
                      {" "}
                      ({(item.release_date || item.first_air_date).split("-")[0]})
                    </span>
                  )}
                </div>
                <div className="search-result-metadata">
                  {item.vote_average > 0 && (
                    <span className="search-result-rating">
                      {item.vote_average.toFixed(1)}/10
                    </span>
                  )}
                  <span className="search-result-type">{item.resultType}</span>
                </div>
              </div>
            </Link>
          ))}
          {results.length === 0 && (
            <div className="search-result">
              <div className="search-result-info">
                <div className="search-result-title">No results found.</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
