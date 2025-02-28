// ========================================
// MovieDetails.js
// This component displays detailed information about a movie including
// poster, title, rating, cast, and other metadata using Bulma's styling system.
// ========================================

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import ActorCard from "../../components/movies/ActorCard";
import { fetchMovieDetails, fetchCollectionDetails } from "../../services/tmdb";
import { formatDate, formatCurrency } from "../../utils/helpers";

/**
 * MovieDetails Component
 * Displays comprehensive information about a movie including poster, title,
 * rating, cast, and other metadata
 */
const MovieDetails = () => {
    // ========================================
    // State Management
    // ========================================

    // Hardcoded Movie ID for testing (Replace with useParams() for dynamic IDs)
    const movieId = "671";

    // Primary state variables for movie data
    const [movie, setMovie] = useState(null);
    const [cast, setCast] = useState([]);
    const [director, setDirector] = useState(null);
    const [trailer, setTrailer] = useState(null);
    const [collection, setCollection] = useState(null);
    const [visibleActors, setVisibleActors] = useState(10);

    // ========================================
    // Data Fetching
    // ========================================

    // Fetch Movie Data from API
    useEffect(() => {
        const loadMovieData = async () => {
            try {
                const movieData = await fetchMovieDetails(movieId);
                if (!movieData) return;

                setMovie(movieData);

                // Extract Cast Data
                if (movieData.credits?.cast?.length > 0) {
                    setCast(movieData.credits.cast);
                }

                // Extract Director Data
                if (movieData.credits?.crew?.length > 0) {
                    const movieDirector = movieData.credits.crew.find(member => member.job === "Director");
                    setDirector(movieDirector || null);
                }

                // Extract Trailer (YouTube)
                if (movieData.videos?.results?.length > 0) {
                    const movieTrailer = movieData.videos.results.find(video =>
                        video.type === "Trailer" && video.site === "YouTube"
                    );
                    setTrailer(movieTrailer || null);
                }

                // Fetch Movie Collection (If Applicable)
                if (movieData.belongs_to_collection) {
                    const collectionData = await fetchCollectionDetails(
                        movieData.belongs_to_collection.id
                    );
                    setCollection(collectionData);
                }
            } catch (error) {
                console.error("Error fetching movie details:", error);
            }
        };

        loadMovieData();
    }, []); // Removed movieId from dependencies

    // ========================================
    // Loading State Handler
    // ========================================

    if (!movie) return (
        <section className="section">
            <div className="container">
                <div className="has-text-centered">
                    <p className="is-size-4">Loading movie details...</p>
                </div>
            </div>
        </section>
    );

    // ========================================
    // Event Handlers
    // ========================================

    // Function to Load More Actors
    const loadMoreActors = () => {
        setVisibleActors((prev) => Math.min(prev + 10, cast.length));
    };

    // ========================================
    // Component Render
    // ========================================

    return (
        <>
            {/* Navigation Bar */}
            <Navbar />

            {/* Main Content Section */}
            <section className="section" style={{ paddingTop: "var(--navbar-height)" }}>
                <div className="container">
                    <div className="columns is-variable is-0-mobile is-3-tablet is-8-desktop">

                        {/* Left Column - Movie Poster and Information */}
                        <div className="column is-one-quarter">
                            <div style={{
                                position: "sticky",
                                top: "calc(var(--navbar-height) + 0.0rem)"
                            }}>

                                {/* Movie Poster */}
                                <figure className="image">
                                    <img
                                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                                        alt={movie.title}
                                        style={{
                                            borderRadius: "12px",
                                            objectFit: "cover",
                                            maxHeight: "450px"
                                        }}
                                    />
                                </figure>

                                {/* Movie Information */}
                                <div className="content mt-4">
                                    <p><strong>Duration:</strong> {movie.runtime} min</p>
                                    <p><strong>Budget:</strong> {formatCurrency(movie.budget)}</p>
                                    <p><strong>Revenue:</strong> {formatCurrency(movie.revenue)}</p>
                                    <p><strong>Genres:</strong> {movie.genres.map(genre =>
                                        genre.name).join(", ")}</p>
                                    <p><strong>Description:</strong> {movie.overview}</p>

                                    {/* Director Information */}
                                    {director && (
                                        <p><strong>Director:</strong> {director.name}</p>
                                    )}

                                    {/* Trailer Link */}
                                    {trailer && (
                                        <div className="mt-4">
                                            <h2 className="title is-5">Trailer</h2>
                                            <a
                                                href={`https://www.youtube.com/watch?v=${trailer.key}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="button is-link is-fullwidth"
                                            >
                                                Watch Trailer
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Title, Rating, and Cast */}
                        <div className="column">

                            {/* Movie Title and Release Year */}
                            <h1 className="title is-3 has-text-weight-bold mb-4">
                                {movie.title}
                                <span className="has-text-weight-normal has-text-grey ml-2">
                                    ({formatDate(movie.release_date, "YYYY")})
                                </span>
                            </h1>

                            {/* Rating Bar */}
                            <div className="mb-5" style={{ maxWidth: "50%" }}>
                                <div className="is-flex is-align-items-center mb-2">
                                    <span className="has-text-weight-bold mr-3"
                                        style={{ minWidth: "40px", textAlign: "right" }}>
                                        {Math.round(movie.vote_average * 10)}%
                                    </span>
                                    <progress
                                        className="progress is-success"
                                        value={movie.vote_average * 10}
                                        max="100"
                                    />
                                </div>
                            </div>

                            {/* Actor Cards Grid - MODIFIED FOR CONSISTENT SIZING */}
                            <div className="columns is-multiline is-variable is-3">
                                {cast.slice(0, visibleActors).map((actor) => (
                                    <div key={actor.id} className="column is-one-third-desktop is-half-tablet">
                                        <ActorCard actor={actor} movieReleaseDate={movie.release_date} currentMovieId={movie.id} />
                                    </div>
                                ))}
                            </div>

                            {/* Load More Actors Button */}
                            {visibleActors < cast.length && (
                                <div className="has-text-centered mt-6">
                                    <button
                                        className="button is-primary is-medium"
                                        onClick={loadMoreActors}
                                    >
                                        Show More Actors
                                    </button>
                                </div>
                            )}

                            {/* Movie Collection Section */}
                            {collection && (
                                <div className="mt-6">
                                    <h2 className="title is-4">Other Movies in This Series</h2>
                                    <div className="content">
                                        <ul>
                                            {collection.parts.map(part => (
                                                <li key={part.id}>
                                                    {part.title} ({formatDate(part.release_date, "YYYY")})
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default MovieDetails;