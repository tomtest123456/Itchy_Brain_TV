// ========================================
// MovieDetails.js
// This component displays detailed information about a movie including
// poster, title, rating, cast, and other metadata using Bulma's styling system.
// ========================================

import React, { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import ActorCard from "../../components/movies/ActorCard";
import { fetchMovieDetails, fetchCollectionDetails, fetchBatchedPersonDetails } from "../../services/tmdb";
import { formatDate, formatCurrency } from "../../utils/helpers";
import Ratings from './Ratings';
import useActorCardGrid from '../../hooks/useActorCardGrid';
import './MovieInfo.css';

// Add this helper function at the top level
const isMobileDevice = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isNarrow = window.innerWidth <= 1024; // Increased breakpoint
    const devicePixelRatio = window.devicePixelRatio || 1;

    console.log('Mobile Detection Debug:', {
        userAgent,
        isMobileByUA: mobileRegex.test(userAgent.toLowerCase()),
        isTouch,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        isNarrow,
        devicePixelRatio,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height
    });

    // More aggressive mobile detection
    return mobileRegex.test(userAgent.toLowerCase()) || isTouch || isNarrow;
};

/**
 * MovieDetails Component
 * Displays comprehensive information about a movie including poster, title,
 * rating, cast, and other metadata
 */
const MovieDetails = () => {
    // ========================================
    // State Management
    // ========================================

    // Get movie ID from URL parameters
    const { id } = useParams();

    // Primary state variables for movie data
    const [movie, setMovie] = useState(null);
    const [cast, setCast] = useState([]);
    const [director, setDirector] = useState(null);
    const [trailer, setTrailer] = useState(null);
    const [collection, setCollection] = useState(null);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [actorDetails, setActorDetails] = useState(new Map());
    const [isLoadingActors, setIsLoadingActors] = useState(false);
    const [isMovieInfoVisible, setIsMovieInfoVisible] = useState(true);
    const [isMobile, setIsMobile] = useState(isMobileDevice());
    const gridContainerRef = useRef(null);

    // Calculate initial visible actors based on screen size
    const calculateInitialActorCount = () => {
        const width = window.innerWidth;
        let columns;
        if (width >= 1024) {
            columns = 3; // Desktop: 3 columns
        } else if (width >= 768) {
            columns = 2; // Tablet: 2 columns
        } else {
            columns = 1; // Mobile: 1 column
        }
        return columns * 3; // Show 3 rows initially
    };

    const [visibleActors, setVisibleActors] = useState(calculateInitialActorCount());

    // Function to load actor details in batches
    const loadActorDetails = async (startIndex, count) => {
        if (!cast || cast.length === 0) return;

        setIsLoadingActors(true);
        try {
            const actorIds = cast.slice(startIndex, startIndex + count).map(actor => actor.id);
            const details = await fetchBatchedPersonDetails(actorIds);

            setActorDetails(prevDetails => {
                const updatedDetails = new Map(prevDetails);
                details.forEach(detail => {
                    if (detail) updatedDetails.set(detail.id, detail);
                });
                return updatedDetails;
            });
        } catch (error) {
            console.error("Error loading actor details:", error);
        } finally {
            setIsLoadingActors(false);
        }
    };

    // Load initial batch of actors (visible + next batch)
    useEffect(() => {
        if (cast && cast.length > 0) {
            const initialCount = calculateInitialActorCount();
            const nextBatchCount = initialCount;
            loadActorDetails(0, initialCount + nextBatchCount);
        }
    }, [cast]);

    // Recalculate visible actors when window resizes
    useEffect(() => {
        const handleResize = () => {
            const newCount = calculateInitialActorCount();
            setVisibleActors(prev => {
                // Only update if the new count is larger than current visible actors
                // This prevents removing already visible actors when screen gets smaller
                return Math.max(prev, newCount);
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Add debug effect for mobile state changes
    useEffect(() => {
        console.log('Mobile State Changed:', {
            isMobile,
            isMovieInfoVisible,
            windowWidth: window.innerWidth,
            timestamp: new Date().toISOString()
        });
    }, [isMobile, isMovieInfoVisible]);

    // Enhanced resize handler
    useEffect(() => {
        const handleResize = () => {
            const newIsMobile = isMobileDevice();
            console.log('Resize Event Debug:', {
                width: window.innerWidth,
                height: window.innerHeight,
                newIsMobile,
                currentIsMobile: isMobile,
                timestamp: new Date().toISOString()
            });
            setIsMobile(newIsMobile);
        };

        // Initial check
        handleResize();

        // Add resize listener
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

    // Enhanced toggle function
    const toggleMovieInfo = () => {
        console.log('Toggle Movie Info Debug:', {
            currentState: isMovieInfoVisible,
            isMobile,
            windowWidth: window.innerWidth,
            timestamp: new Date().toISOString()
        });
        setIsMovieInfoVisible(prev => !prev);
    };

    // Get optimal card count based on grid layout
    const { optimalCardCount, cardsPerRow } = useActorCardGrid({
        desiredTotal: visibleActors,
        cardMinWidth: 300,
        containerSelector: '.cast-grid-container'
    });

    // ========================================
    // Data Fetching
    // ========================================

    // Fetch Movie Data from API
    useEffect(() => {
        const loadMovieData = async () => {
            try {
                const movieData = await fetchMovieDetails(id);
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

        if (id) {
            loadMovieData();
        }
    }, [id]); // Dependency on id

    // Add intersection observer for infinite scroll
    useEffect(() => {
        if (!cast || cast.length === 0) return;

        const options = {
            root: null,
            rootMargin: '100px',
            threshold: 0.1
        };

        const handleIntersect = (entries) => {
            const [entry] = entries;
            if (entry.isIntersecting && !isLoadingActors && visibleActors < cast.length) {
                loadMoreActors();
            }
        };

        const observer = new IntersectionObserver(handleIntersect, options);

        // Create a sentinel element for infinite scroll
        const sentinel = document.createElement('div');
        sentinel.style.height = '1px';
        if (gridContainerRef.current) {
            gridContainerRef.current.appendChild(sentinel);
            observer.observe(sentinel);
        }

        return () => {
            if (sentinel) {
                observer.unobserve(sentinel);
                sentinel.remove();
            }
            observer.disconnect();
        };
    }, [cast, visibleActors, isLoadingActors]);

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
    const loadMoreActors = async () => {
        if (isLoadingActors || visibleActors >= cast.length) return;

        setIsLoadingActors(true);
        const increment = calculateInitialActorCount();

        // Simulate loading delay for smoother UX
        await new Promise(resolve => setTimeout(resolve, 300));

        setVisibleActors(prev => Math.min(prev + increment, cast.length));
        setIsLoadingActors(false);
    };

    // Function to format runtime to hours and minutes
    const formatRuntime = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}hr ${remainingMinutes}m`;
    };

    // ========================================
    // Component Render
    // ========================================

    return (
        <>
            {/* Navigation Bar */}
            <Navbar />

            {/* Main Content Section */}
            <section className="section movie-details-section" style={{ paddingTop: "var(--navbar-height)" }}>
                <div className="container">
                    <div className={`columns is-variable is-0-mobile is-3-tablet is-8-desktop ${!isMovieInfoVisible && isMobile ? 'mobile-info-hidden' : ''}`}>

                        {/* Left Column - Movie Info */}
                        <div className={`column is-one-quarter movie-info-column ${!isMovieInfoVisible && isMobile ? 'is-hidden' : ''}`} style={{ position: 'relative' }}>
                            <div
                                className="movie-info-scroll-trigger"
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: '-100vw',
                                    width: '100vw',
                                    height: '100%',
                                    zIndex: 1
                                }}
                                onWheel={(e) => {
                                    const container = document.querySelector('.movie-info-container');
                                    if (container) {
                                        container.scrollTop += e.deltaY;
                                        e.preventDefault();
                                    }
                                }}
                            />
                            <div className="movie-info-container">
                                {/* Movie Poster */}
                                <div className="movie-poster">
                                    <img
                                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                                        alt={movie.title}
                                    />
                                </div>

                                {/* Movie Ratings */}
                                <Ratings imdbId={movie.imdb_id} />

                                {/* Movie Info Section */}
                                <div className="movie-info-section">
                                    <h2 className="title is-5">Movie Info</h2>

                                    <div className="movie-info-item">
                                        <div className="movie-info-row">
                                            <span className="movie-info-label">Runtime:</span>
                                            {formatRuntime(movie.runtime)}
                                        </div>
                                    </div>

                                    <div className="movie-info-item">
                                        <div className="movie-info-row">
                                            <span className="movie-info-label">Genre:</span>
                                            {movie.genres.slice(0, 3).map(genre => genre.name).join(", ")}
                                        </div>
                                    </div>

                                    {director && (
                                        <div className="movie-info-item">
                                            <div className="movie-info-row">
                                                <span className="movie-info-label">Director:</span>
                                                <Link to={`/person/${director.id}`} className="movie-info-link">
                                                    {director.name}
                                                </Link>
                                            </div>
                                        </div>
                                    )}

                                    <div className="movie-info-item">
                                        <div className="movie-info-row">
                                            <span className="movie-info-label">Budget:</span>
                                            {formatCurrency(movie.budget)}
                                        </div>
                                    </div>

                                    <div className="movie-info-item">
                                        <div className="movie-info-row">
                                            <span className="movie-info-label">Revenue:</span>
                                            {formatCurrency(movie.revenue)}
                                        </div>
                                    </div>

                                    <div className="movie-info-item">
                                        <span className="movie-info-label">Description:</span>
                                        <div className={`movie-info-description ${isDescriptionExpanded ? 'expanded' : ''}`}>
                                            {movie.overview}
                                        </div>
                                        <span
                                            className="description-toggle"
                                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                        >
                                            {isDescriptionExpanded ? 'Show less' : 'Show more...'}
                                        </span>
                                    </div>

                                    {trailer && (
                                        <div className="movie-info-item">
                                            <a
                                                href={`https://www.youtube.com/watch?v=${trailer.key}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="trailer-button"
                                            >
                                                Trailer
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* Collection Movies (if part of a collection) */}
                                {collection && (
                                    <div className="collection-section">
                                        <h2 className="title is-5">Movies in Collection</h2>
                                        <ul className="collection-movies-list">
                                            {collection.parts
                                                .sort((a, b) => new Date(a.release_date) - new Date(b.release_date))
                                                .map(part => (
                                                    <li key={part.id} className="collection-movie-item">
                                                        <Link
                                                            to={`/movie/${part.id}`}
                                                            className={`collection-movie-link ${part.id === parseInt(id) ? 'current' : ''}`}
                                                        >
                                                            {part.id === parseInt(id) && (
                                                                <span className="arrow-icon">→ </span>
                                                            )}
                                                            {part.title} {'('}{formatDate(part.release_date, "YY")}{')'}
                                                        </Link>
                                                    </li>
                                                ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Title, Rating, and Cast */}
                        <div className={`column ${!isMovieInfoVisible && isMobile ? 'is-full' : ''}`}>

                            {/* Movie Title and Release Year */}
                            <h1 className="title is-3 has-text-weight-bold mb-4 mobile-title">
                                {movie.title}
                                <span className="has-text-weight-normal has-text-grey ml-2">
                                    ({formatDate(movie.release_date, "YYYY")})
                                </span>
                            </h1>

                            {/* Actor Cards Grid */}
                            <div className="cast-grid-container" ref={gridContainerRef}>
                                <div className="columns is-multiline is-variable is-3">
                                    {cast.slice(0, visibleActors).map((actor) => (
                                        <div key={actor.id} className="column is-one-third-desktop is-half-tablet">
                                            <ActorCard
                                                actor={actor}
                                                movieReleaseDate={movie.release_date}
                                                currentMovieId={movie.id}
                                                preloadedDetails={actorDetails.get(actor.id)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Remove the Load More button since we're using infinite scroll */}
                            {isLoadingActors && visibleActors < cast.length && (
                                <div className="has-text-centered mt-6">
                                    <div className="loading-spinner">Loading...</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Enhanced Mobile Toggle Button */}
                    <button
                        className={`mobile-info-toggle ${isMobile ? 'is-visible' : ''} ${isMovieInfoVisible ? 'is-active' : ''}`}
                        onClick={toggleMovieInfo}
                        aria-label={isMovieInfoVisible ? 'Hide Movie Info' : 'Show Movie Info'}
                    >
                        {isMovieInfoVisible ? '◀' : '▶'}
                    </button>
                </div>
            </section>
        </>
    );
};

export default MovieDetails;