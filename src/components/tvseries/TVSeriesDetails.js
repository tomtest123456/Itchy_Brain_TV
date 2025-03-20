// ========================================
// TVSeriesDetails.js
// This component displays detailed information about a TV Show including
// poster, title, rating, cast, and other metadata using Bulma's styling system.
// ========================================

import React, { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import ActorCard from "../actorcard/ActorCard";
import { fetchTvShowDetails, fetchCollectionDetails, fetchBatchedPersonDetails } from "../../services/tmdb";
import { formatDate, formatCurrency } from "../../utils/helpers";
import Ratings from '../ratings/Ratings';
import useActorCardGrid from '../../hooks/useActorCardGrid';
import '../../components/common/MovieTVPage.css';

// Add this helper function at the top level
const isMobileDevice = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isNarrow = window.innerWidth <= 1024;
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

    return mobileRegex.test(userAgent.toLowerCase()) || isTouch || isNarrow;
};

/**
 * TVSeriesDetails Component
 * Displays comprehensive information about a TV Show including poster, title,
 * rating, cast, and other metadata.
 */
const TVSeriesDetails = () => {
    // ========================================
    // State Management
    // ========================================

    // Get TV Show ID from URL parameters
    const { id } = useParams();

    // Primary state variables for TV show data
    const tvInfoContainerRef = useRef(null);
    const [tvShow, setTvShow] = useState(null);
    const [cast, setCast] = useState([]);
    const [director, setDirector] = useState(null); // Will hold the "creator"
    const [trailer, setTrailer] = useState(null);
    const [collection, setCollection] = useState(null);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [actorDetails, setActorDetails] = useState(new Map());
    const [isLoadingActors, setIsLoadingActors] = useState(false);
    const [isTvShowInfoVisible, setIsTvShowInfoVisible] = useState(true);
    const [isMobile, setIsMobile] = useState(isMobileDevice());
    const gridContainerRef = useRef(null);

    // Calculate initial visible actors based on screen size
    const calculateInitialActorCount = () => {
        const width = window.innerWidth;
        let columns;
        if (width >= 1024) {
            columns = 3;
        } else if (width >= 768) {
            columns = 2;
        } else {
            columns = 1;
        }
        return columns * 3;
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
            setVisibleActors(prev => Math.max(prev, newCount));
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Debug effect for mobile state changes
    useEffect(() => {
        console.log('Mobile State Changed:', {
            isMobile,
            isTvShowInfoVisible,
            windowWidth: window.innerWidth,
            timestamp: new Date().toISOString()
        });
    }, [isMobile, isTvShowInfoVisible]);

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

        handleResize();

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

    // Toggle function for TV Show Info visibility
    const toggleTvShowInfo = () => {
        console.log('Toggle TV Show Info Debug:', {
            currentState: isTvShowInfoVisible,
            isMobile,
            windowWidth: window.innerWidth,
            timestamp: new Date().toISOString()
        });
        setIsTvShowInfoVisible(prev => !prev);
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

    useEffect(() => {
        const loadTvShowData = async () => {
            try {
                const tvShowData = await fetchTvShowDetails(id);
                if (!tvShowData) return;

                setTvShow(tvShowData);

                // Extract Cast Data
                if (tvShowData.credits?.cast?.length > 0) {
                    setCast(tvShowData.credits.cast);
                }

                // Extract Creator Data (using created_by array)
                if (tvShowData.created_by && tvShowData.created_by.length > 0) {
                    setDirector(tvShowData.created_by[0]);
                }

                // Extract Trailer (YouTube)
                if (tvShowData.videos?.results?.length > 0) {
                    const tvTrailer = tvShowData.videos.results.find(video =>
                        video.type === "Trailer" && video.site === "YouTube"
                    );
                    setTrailer(tvTrailer || null);
                }

                // Fetch TV Show Collection (if applicable)
                if (tvShowData.belongs_to_collection) {
                    const collectionData = await fetchCollectionDetails(
                        tvShowData.belongs_to_collection.id
                    );
                    setCollection(collectionData);
                }
            } catch (error) {
                console.error("Error fetching TV show details:", error);
            }
        };

        if (id) {
            loadTvShowData();
        }
    }, [id]);

    // Intersection observer for infinite scroll
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

    // Reset scroll positions when TV show ID changes
    useEffect(() => {
        window.scrollTo(0, 0);
        if (tvInfoContainerRef.current) {
            tvInfoContainerRef.current.scrollTop = 0;
        }
    }, [id]);

    // ========================================
    // Loading State Handler
    // ========================================

    if (!tvShow) return (
        <section className="section">
            <div className="container">
                <div className="has-text-centered">
                    <p className="is-size-4">Loading TV show details...</p>
                </div>
            </div>
        </section>
    );

    // Function to Load More Actors
    const loadMoreActors = async () => {
        if (isLoadingActors || visibleActors >= cast.length) return;

        setIsLoadingActors(true);
        const increment = calculateInitialActorCount();

        await new Promise(resolve => setTimeout(resolve, 300));

        setVisibleActors(prev => Math.min(prev + increment, cast.length));
        setIsLoadingActors(false);
    };

    // Function to format runtime to hours and minutes (using first episode runtime)
    const formatRuntime = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}hr ${remainingMinutes}m`;
    };

    // Determine episode runtime (use first value in episode_run_time array)
    const episodeRuntime = (tvShow.episode_run_time && tvShow.episode_run_time.length > 0)
        ? tvShow.episode_run_time[0]
        : 0;

    // ========================================
    // Component Render
    // ========================================

    return (
        <>
            {/* Main Content Section */}
            <section className="section tv-details-section" style={{ paddingTop: "var(--navbar-height)" }}>
                <div className="container">
                    <div className={`columns is-variable is-0-mobile is-3-tablet is-8-desktop ${!isTvShowInfoVisible && isMobile ? 'mobile-info-hidden' : ''}`}>

                        {/* Left Column - TV Show Info */}
                        <div className={`column is-one-quarter tv-info-column ${!isTvShowInfoVisible && isMobile ? 'is-hidden' : ''}`} style={{ position: 'relative' }}>
                            <div
                                className="tv-info-scroll-trigger"
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: '-100vw',
                                    width: '100vw',
                                    height: '100%',
                                    zIndex: 1
                                }}
                                onWheel={(e) => {
                                    const container = document.querySelector('.tv-info-container');
                                    if (container) {
                                        container.scrollTop += e.deltaY;
                                        e.preventDefault();
                                    }
                                }}
                            />
                            <div className="tv-info-container" ref={tvInfoContainerRef}>
                                {/* TV Show Poster */}
                                <div className="tv-poster">
                                    <img
                                        src={`https://image.tmdb.org/t/p/w500${tvShow.poster_path}`}
                                        alt={tvShow.name}
                                    />
                                </div>

                                {/* TV Show Ratings */}
                                <Ratings imdbId={tvShow.imdb_id} />

                                {/* TV Show Info Section */}
                                <div className="tv-info-section">
                                    <h2 className="title is-5">TV Show Info</h2>

                                    <div className="tv-info-item">
                                        <div className="tv-info-row">
                                            <span className="tv-info-label">Runtime:</span>
                                            {formatRuntime(episodeRuntime)}
                                        </div>
                                    </div>

                                    <div className="tv-info-item">
                                        <div className="tv-info-row">
                                            <span className="tv-info-label">Genre:</span>
                                            {tvShow.genres.slice(0, 3).map(genre => genre.name).join(", ")}
                                        </div>
                                    </div>

                                    {director && (
                                        <div className="tv-info-item">
                                            <div className="tv-info-row">
                                                <span className="tv-info-label">Creator:</span>
                                                <Link to={`/person/${director.id}`} className="tv-info-link">
                                                    {director.name}
                                                </Link>
                                            </div>
                                        </div>
                                    )}

                                    <div className="tv-info-item">
                                        <div className="tv-info-row">
                                            <span className="tv-info-label">Seasons:</span>
                                            {tvShow.number_of_seasons}
                                        </div>
                                    </div>

                                    <div className="tv-info-item">
                                        <div className="tv-info-row">
                                            <span className="tv-info-label">Episodes:</span>
                                            {tvShow.number_of_episodes}
                                        </div>
                                    </div>

                                    <div className="tv-info-item">
                                        <span className="tv-info-label">Description:</span>
                                        <div className={`tv-info-description ${isDescriptionExpanded ? 'expanded' : ''}`}>
                                            {tvShow.overview}
                                        </div>
                                        <span
                                            className="description-toggle"
                                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                        >
                                            {isDescriptionExpanded ? 'Show less' : 'Show more...'}
                                        </span>
                                    </div>

                                    {trailer && (
                                        <div className="tv-info-item">
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

                                {/* Collection TV Shows (if part of a collection) */}
                                {collection && (
                                    <div className="collection-section">
                                        <h2 className="title is-5">TV Series Collection</h2>
                                        <ul className="collection-series-list">
                                            {collection.parts
                                                .sort((a, b) => new Date(a.first_air_date) - new Date(b.first_air_date))
                                                .map(part => (
                                                    <li key={part.id} className="collection-series-item">
                                                        <Link
                                                            to={`/tv/${part.id}`}
                                                            className={`collection-series-link ${part.id === parseInt(id) ? 'current' : ''}`}
                                                        >
                                                            {part.id === parseInt(id) && (
                                                                <span className="arrow-icon">→ </span>
                                                            )}
                                                            {part.name} {'('}{formatDate(part.first_air_date, "YY")}{')'}
                                                        </Link>
                                                    </li>
                                                ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Title, Rating, and Cast */}
                        <div className={`column ${!isTvShowInfoVisible && isMobile ? 'is-full' : ''}`}>
                            <h1 className="title is-3 has-text-weight-bold mb-4 mobile-title">
                                {tvShow.name}
                                <span className="has-text-weight-normal has-text-grey ml-2">
                                    ({formatDate(tvShow.first_air_date, "YYYY")})
                                </span>
                            </h1>

                            {/* Actor Cards Grid */}
                            <div className="cast-grid-container" ref={gridContainerRef}>
                                <div className="columns is-multiline is-variable is-3">
                                    {cast.slice(0, visibleActors).map((actor) => (
                                        <div key={actor.id} className="column is-one-third-desktop is-half-tablet">
                                            <ActorCard
                                                actor={actor}
                                                seriesReleaseDate={tvShow.first_air_date}
                                                currentSeriesId={tvShow.id}
                                                preloadedDetails={actorDetails.get(actor.id)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {isLoadingActors && visibleActors < cast.length && (
                                <div className="has-text-centered mt-6">
                                    <div className="loading-spinner">Loading...</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Enhanced Mobile Toggle Button */}
                    <button
                        className={`mobile-info-toggle ${isMobile ? 'is-visible' : ''} ${isTvShowInfoVisible ? 'is-active' : ''}`}
                        onClick={toggleTvShowInfo}
                        aria-label={isTvShowInfoVisible ? 'Hide TV Show Info' : 'Show TV Show Info'}
                    >
                        {isTvShowInfoVisible ? '◀' : '▶'}
                    </button>
                </div>
            </section>
        </>
    );
};

export default TVSeriesDetails;
