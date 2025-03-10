// ========================================
// ActorCard.js
// This component displays information about an actor including their profile picture,
// nationality flag, name, age, character name, and notable works.
// It uses a hybrid approach with Bulma CSS and custom styling.
// ========================================

import React from "react";
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import Flag from "react-world-flags"
import { fetchPersonDetails } from "../../services/tmdb"
import { formatDate, formatCurrency } from "../../utils/helpers";
import { EXCLUDED_TV_GENRES, EXCLUDED_MOVIE_GENRES } from "../../services/tmdb"
import "./ActorCard.css"

/**
 * Truncates text with ellipsis while preserving the year in parentheses
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} - Truncated text with preserved year
 */
const truncateWithYear = (text, maxLength = 30) => {
    if (!text) return ""

    // Extract year if present
    const yearMatch = text.match(/\(\d{4}\)/)
    const year = yearMatch ? yearMatch[0] : ""
    const baseText = yearMatch ? text.slice(0, -year.length).trim() : text

    if (baseText.length + year.length <= maxLength) {
        return text
    }

    // Account for the length of ".." plus the year
    const truncateLength = maxLength - (year ? year.length + 2 : 2)
    return `${baseText.slice(0, truncateLength)}..${year}`
}

/**
 * Formats a date string to YYYY
 * @param {string} dateString - Date string from API
 * @returns {string} - Formatted year or empty string if invalid
 */
const formatYear = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? "" : date.getFullYear().toString()
}

/**
 * Formats a year to abbreviated format ('13 instead of 2013)
 * @param {string} dateString - Date string from API
 * @returns {string} - Formatted year or empty string if invalid
 */
const formatYearAbbrev = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ""
    return `('${date.getFullYear().toString().slice(2)})`
}

/**
 * Formats a date range for collections
 * @param {string} startDate - First movie release date
 * @param {string} endDate - Last movie release date
 * @returns {string} - Formatted date range e.g. ('04-'13)
 */
const formatDateRange = (startDate, endDate) => {
    const start = formatYearAbbrev(startDate)
    const end = formatYearAbbrev(endDate)
    return start === end ? `${start}` : `${start}-${end}`
}

/**
 * Filters out unwanted titles based on common patterns
 * @param {string} title - The title to check
 * @returns {boolean} - Whether the title should be included
 */
const isValidTitle = (title) => {
    if (!title) return false

    const excludePatterns = [
        "Making of",
        "Behind the Scenes",
        "Greatest Hits",
        "Special Features",
        "Documentary",
        "Awards",
        "Ceremony",
        "Interview",
        "Red Carpet",
        "Press Conference",
        "Featurette",
        "Bonus Content",
        "Extra Features",
        "Commentary",
        "Live Show",
        "Concert",
        "Tour",
        "Premiere",
    ]

    return !excludePatterns.some((pattern) => title.toLowerCase().includes(pattern.toLowerCase()))
}

/**
 * Determines if a role is significant enough to be considered notable work
 * @param {Object} credit - The credit object containing role information
 * @returns {boolean} - Whether the role is significant enough to include
 */
const isSignificantRole = (credit) => {
    // Exclude cameos, uncredited roles, and self appearances
    if (!credit.character ||
        credit.character.toLowerCase().includes('uncredited') ||
        credit.character.toLowerCase().includes('self')) {
        return false;
    }

    // For TV shows, only include if they appear in multiple episodes
    if (credit.media_type === 'tv' && (credit.episode_count || 0) < 3) {
        return false;
    }

    // For movies, exclude if they're not in main cast (order > 15 typically means minor role)
    if (credit.media_type === 'movie' && credit.order > 15) {
        return false;
    }

    return true;
};

/**
 * Scoring System for Notable Works
 * -------------------------------
 * The scoring system uses different weights for different media types:
 * 1. Collections (Highest Priority):
 *    - Base popularity score (x5)
 *    - Movie count boost (logarithmic scale to prevent large collections dominating)
 *    - Average movie popularity in collection
 *    - Vote score (considers both average and count)
 *    - Role significance boost
 *    - Final score multiplied by 3 to prioritize collections
 * 
 * 2. Movies (Medium Priority):
 *    - Base popularity score (x2)
 *    - Role significance boost (higher for leading roles)
 *    - Vote score
 *    - Final score multiplied by 2
 * 
 * 3. TV Shows (Lowest Priority):
 *    - Base popularity score
 *    - Episode count boost
 *    - Role significance
 *    - Vote score
 *    - No additional multiplier
 */

/**
 * Calculates overall score for a work to determine its notability
 * @param {Object} work - The work object containing all information
 * @returns {number} - Final score determining work's ranking in notable works list
 */
const calculateOverallScore = (work) => {
    let score = 0;
    const basePopularity = work.popularity || 0;
    const voteScore = (work.vote_average || 0) * Math.log10((work.vote_count || 0) + 1);

    if (work.media_type === 'collection') {
        // Collection scoring (highest priority)
        score = basePopularity * 5; // Higher base popularity weight

        // Movie count boost (logarithmic to prevent large collections from dominating)
        const movieCountBoost = Math.log10(work.movies?.length || 1) * 200;

        // Average movie popularity and vote score
        const avgMoviePopularity = work.movies?.reduce((sum, m) => sum + (m.popularity || 0), 0) / (work.movies?.length || 1);
        const avgMovieVoteScore = work.movies?.reduce((sum, m) => {
            return sum + ((m.vote_average || 0) * Math.log10((m.vote_count || 0) + 1));
        }, 0) / (work.movies?.length || 1);

        // Role significance boost
        const roleBoost = work.movies?.reduce((boost, m) => {
            return boost + (m.order < 3 ? 100 : m.order < 5 ? 50 : 20);
        }, 0) || 0;

        score += movieCountBoost + (avgMoviePopularity * 2) + (avgMovieVoteScore * 50) + roleBoost;
        score *= 3; // Final collection multiplier

    } else if (work.media_type === 'movie') {
        // Movie scoring (medium priority)
        score = basePopularity * 2;

        // Role significance boost
        const roleBoost = work.order < 4 ? 200 : work.order < 8 ? 100 : 50;

        // Vote score has more weight for individual movies
        score += roleBoost + (voteScore * 30);
        score *= 2; // Final movie multiplier

    } else if (work.media_type === 'tv') {
        // TV Show scoring (lowest priority)
        score = basePopularity;

        // Episode count boost (more episodes = more significant role)
        const episodeBoost = Math.log10((work.episode_count || 1) + 1) * 50;

        // Role significance is weighted less for TV shows
        const roleBoost = work.order < 3 ? 100 : work.order < 5 ? 50 : 25;

        score += episodeBoost + roleBoost + (voteScore * 20);
        // No additional multiplier for TV shows
    }

    return score;
};

/**
 * Processes notable works for display
 * @param {Object} actorDetails - The actor details containing credits
 * @param {string} workFilter - The current work filter (movies, tv, or both)
 * @returns {Array} - Array of notable works sorted by score
 */
const processNotableWorks = (actorDetails, workFilter) => {
    if (!actorDetails) return [];

    console.log('Processing notable works:', { workFilter, hasDetails: !!actorDetails });

    // Get filtered TV shows
    const tvShows = workFilter !== 'movies' ? (actorDetails.tv_credits?.cast || [])
        .filter(show =>
            !show.genre_ids?.some(id => EXCLUDED_TV_GENRES.includes(id)) &&
            isSignificantRole({ ...show, media_type: 'tv' })
        )
        .map(show => ({
            id: show.id,
            title: show.name,
            media_type: 'tv',
            popularity: show.popularity,
            vote_average: show.vote_average,
            vote_count: show.vote_count,
            release_date: show.first_air_date,
            character: show.character,
            episode_count: show.episode_count,
            displayTitle: {
                title: show.name,
                year: show.first_air_date ? ` ('${new Date(show.first_air_date).getFullYear().toString().slice(2)})` : ''
            }
        })) : [];

    // Get filtered movies and collections
    const movieResults = workFilter !== 'tv' ? (actorDetails.movie_credits?.collections || [])
        .map(collection => ({
            id: collection.id,
            title: collection.name,
            media_type: 'collection',
            popularity: collection.popularity,
            vote_average: collection.vote_average,
            vote_count: collection.vote_count,
            movies: collection.movies,
            displayTitle: {
                title: collection.name,
                year: ` (x${collection.movies.length})`
            }
        }))
        .concat((actorDetails.movie_credits?.cast || [])
            .filter(movie =>
                !movie.genre_ids?.some(id => EXCLUDED_MOVIE_GENRES.includes(id)) &&
                isSignificantRole(movie)
            )
            .map(movie => ({
                id: movie.id,
                title: movie.title,
                media_type: 'movie',
                popularity: movie.popularity,
                vote_average: movie.vote_average,
                vote_count: movie.vote_count,
                release_date: movie.release_date,
                character: movie.character,
                order: movie.order,
                displayTitle: {
                    title: movie.title,
                    year: movie.release_date ? ` ('${new Date(movie.release_date).getFullYear().toString().slice(2)})` : ''
                }
            }))) : [];

    // Combine and sort all works
    const allWorks = [...movieResults, ...tvShows]
        .sort((a, b) => calculateOverallScore(b) - calculateOverallScore(a));

    console.log('Total notable works found:', allWorks.length);
    return allWorks; // Remove the .slice(0, 5) to allow for "Show More" functionality
};

/**
 * ActorCard Component
 * @param {Object} actor - Actor data from TMDB API
 * @param {string} movieReleaseDate - Release date of the movie
 * @param {string} currentMovieId - ID of the current movie being viewed
 */
const ActorCard = ({ actor, movieReleaseDate, currentMovieId, preloadedDetails }) => {
    const [actorDetails, setActorDetails] = useState(preloadedDetails || null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [notableWorks, setNotableWorks] = useState([]);
    const [isLoading, setIsLoading] = useState(!preloadedDetails);
    const [workFilter, setWorkFilter] = useState('both');
    const [imageLoadError, setImageLoadError] = useState(false);
    const [loadedImages, setLoadedImages] = useState(new Set());
    const [expandedCollections, setExpandedCollections] = useState(new Set());
    const [visibleWorksCount, setVisibleWorksCount] = useState(5);

    // Reset expanded collections when navigating to a different movie
    useEffect(() => {
        setExpandedCollections(new Set());
        setVisibleWorksCount(5);
    }, [currentMovieId]);

    // Toggle collection expansion
    const toggleCollection = (e, collectionId) => {
        e.preventDefault();
        e.stopPropagation();
        setExpandedCollections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(collectionId)) {
                newSet.delete(collectionId);
            } else {
                newSet.add(collectionId);
            }
            return newSet;
        });
    };

    // Update notable works when actor details or work filter changes
    useEffect(() => {
        if (actorDetails) {
            const works = processNotableWorks(actorDetails, workFilter);
            console.log('Setting notable works:', {
                total: works.length,
                visible: visibleWorksCount,
                hasShowMoreButton: works.length > visibleWorksCount
            });
            setNotableWorks(works);
        }
    }, [actorDetails, workFilter]);

    // Only fetch details if we don't have preloaded details
    useEffect(() => {
        const loadActorDetails = async () => {
            if (!preloadedDetails && actor?.id) {
                try {
                    setIsLoading(true);
                    const details = await fetchPersonDetails(actor.id);
                    if (details) {
                        setActorDetails(details);
                    }
                } catch (error) {
                    console.error("Error loading actor details:", error);
                } finally {
                    setIsLoading(false);
                }
            } else if (preloadedDetails) {
                setActorDetails(preloadedDetails);
                setIsLoading(false);
            }
        };

        loadActorDetails();
    }, [actor?.id, preloadedDetails]);

    // Calculate actor's current age
    const calculateAge = (birthdate) => {
        if (!birthdate) return null

        const today = new Date()
        const birthDate = new Date(birthdate)
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--
        }

        return age
    }

    // Calculate actor's age at time of filming
    const calculateAgeAtFilming = () => {
        if (!actorDetails?.birthday || !movieReleaseDate) return null

        const birthDate = new Date(actorDetails.birthday)
        const filmingDate = new Date(movieReleaseDate)
        filmingDate.setFullYear(filmingDate.getFullYear() - 1)

        let age = filmingDate.getFullYear() - birthDate.getFullYear()
        const monthDiff = filmingDate.getMonth() - birthDate.getMonth()

        if (monthDiff < 0 || (monthDiff === 0 && filmingDate.getDate() < birthDate.getDate())) {
            age--
        }

        return age > 0 ? age : null
    }

    // Get nationality from place of birth
    const getNationality = () => {
        if (!actorDetails?.place_of_birth) return null
        const parts = actorDetails.place_of_birth.split(", ")
        return parts[parts.length - 1]
    }

    // Map country name to country code
    const getCountryCode = (countryName) => {
        if (!countryName) return null

        const countryMap = {
            "United States": "US",
            USA: "US",
            "United States of America": "US",
            "United Kingdom": "GB",
            UK: "GB",
            England: "GB",
            Scotland: "GB",
            Wales: "GB",
            Canada: "CA",
            Australia: "AU",
            France: "FR",
            Germany: "DE",
            Italy: "IT",
            Spain: "ES",
            Japan: "JP",
            China: "CN",
            India: "IN",
            Brazil: "BR",
            Mexico: "MX",
            Russia: "RU",
            Ireland: "IE",
            "New Zealand": "NZ",
            Sweden: "SE",
            Norway: "NO",
            Denmark: "DK",
            Finland: "FI",
            Netherlands: "NL",
            Belgium: "BE",
            Switzerland: "CH",
            Austria: "AT",
            Portugal: "PT",
            Greece: "GR",
            "South Africa": "ZA",
        }

        return countryMap[countryName] || null
    }

    // Function to preload an image
    const preloadImage = (url) => {
        if (!url || loadedImages.has(url)) return;

        const img = new Image();
        img.onload = () => {
            setLoadedImages(prev => new Set([...prev, url]));
        };
        img.src = url;
    };

    // Get profile image URL with error handling
    const getProfileImageUrl = (index) => {
        if (!actorDetails?.images?.profiles && !actor.profile_path) {
            return "/placeholder-actor.png";
        }

        if (actorDetails?.images?.profiles?.length > 0) {
            return `https://image.tmdb.org/t/p/w300${actorDetails.images.profiles[index].file_path}`;
        }

        return `https://image.tmdb.org/t/p/w300${actor.profile_path}`;
    };

    // Handle image navigation with preloading
    const handleNextImage = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (actorDetails?.images?.profiles?.length > 0) {
            const nextIndex = (currentImageIndex + 1) % actorDetails.images.profiles.length;
            setCurrentImageIndex(nextIndex);
            setImageLoadError(false);

            // Preload next image
            const nextNextIndex = (nextIndex + 1) % actorDetails.images.profiles.length;
            preloadImage(getProfileImageUrl(nextNextIndex));
        }
    };

    const handlePrevImage = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (actorDetails?.images?.profiles?.length > 0) {
            const prevIndex = currentImageIndex === 0 ? actorDetails.images.profiles.length - 1 : currentImageIndex - 1;
            setCurrentImageIndex(prevIndex);
            setImageLoadError(false);

            // Preload previous image
            const prevPrevIndex = prevIndex === 0 ? actorDetails.images.profiles.length - 1 : prevIndex - 1;
            preloadImage(getProfileImageUrl(prevPrevIndex));
        }
    };

    // Handle image load error
    const handleImageError = () => {
        setImageLoadError(true);
        // Try next image if available
        if (actorDetails?.images?.profiles?.length > 1) {
            const nextIndex = (currentImageIndex + 1) % actorDetails.images.profiles.length;
            setCurrentImageIndex(nextIndex);
        }
    };

    // Preload adjacent images when actor details change
    useEffect(() => {
        if (actorDetails?.images?.profiles?.length > 0) {
            // Preload current image
            preloadImage(getProfileImageUrl(currentImageIndex));

            // Preload next image
            const nextIndex = (currentImageIndex + 1) % actorDetails.images.profiles.length;
            preloadImage(getProfileImageUrl(nextIndex));

            // Preload previous image
            const prevIndex = currentImageIndex === 0 ? actorDetails.images.profiles.length - 1 : currentImageIndex - 1;
            preloadImage(getProfileImageUrl(prevIndex));
        }
    }, [actorDetails, currentImageIndex]);

    // Function to show more notable works
    const handleShowMore = () => {
        console.log('Show more clicked:', {
            before: visibleWorksCount,
            after: visibleWorksCount + 5,
            total: notableWorks.length
        });
        setVisibleWorksCount(prev => prev + 5);
    };

    if (isLoading) {
        return (
            <div className="card">
                <div className="card-content has-text-centered">
                    <p>Loading actor details...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="card">
            <div className="profileImageContainer">
                <Link to={`/actor/${actor.id}`}>
                    <div className="profileImage">
                        <img
                            src={getProfileImageUrl(currentImageIndex)}
                            alt={actor.name}
                            className="profileImageElement"
                            onError={handleImageError}
                        />
                        {actorDetails?.images?.profiles?.length > 1 && (
                            <>
                                <button onClick={handlePrevImage} className="imageNavButtonLeft">
                                    &lt;
                                </button>
                                <button onClick={handleNextImage} className="imageNavButtonRight">
                                    &gt;
                                </button>
                            </>
                        )}
                        {getNationality() && getCountryCode(getNationality()) && (
                            <div className="flagContainer">
                                <Flag code={getCountryCode(getNationality())} className="flag" />
                            </div>
                        )}
                    </div>
                </Link>
            </div>

            <div className="cardContent">
                <Link to={`/actor/${actor.id}`} className="nameLink">
                    <h3 className="actorName">
                        <span className="nameText">{truncateWithYear(actor.name, 20)}</span>
                        {actorDetails?.birthday && <span className="ageDisplay"> ({calculateAge(actorDetails.birthday)})</span>}
                    </h3>
                </Link>

                <p className="characterName">
                    <span className="characterText">as {truncateWithYear(actor.character, 25)}</span>
                    {calculateAgeAtFilming() && <span className="ageAtFilming"> ({calculateAgeAtFilming()})</span>}
                </p>

                <div className="notableWorksSection">
                    <div className="notableWorksHeader">
                        <p className="notableWorksTitle">Notable Work:</p>
                        <div className="filterButtons">
                            <button
                                className={`filterButton ${workFilter === 'movies' ? 'active' : ''}`}
                                onClick={() => setWorkFilter(workFilter === 'movies' ? 'tv' : 'movies')}
                            >
                                Movies
                            </button>
                            <button
                                className={`filterButton ${workFilter === 'tv' ? 'active' : ''}`}
                                onClick={() => setWorkFilter(workFilter === 'tv' ? 'movies' : 'tv')}
                            >
                                TV
                            </button>
                        </div>
                    </div>
                    <ul className="notableWorksList">
                        {notableWorks.slice(0, visibleWorksCount).map((work) => (
                            <li key={`${work.id}-${work.media_type}`} className="notableWorkItem">
                                {work.media_type === "collection" ? (
                                    <div className="collectionContainer">
                                        <Link
                                            to={`/collection/${work.id}`}
                                            className={`notableWorkLink ${work.media_type}`}
                                            onClick={(e) => toggleCollection(e, work.id)}
                                        >
                                            <span className="title-text">
                                                {work.displayTitle.title}
                                            </span>
                                            <span className="year-text">
                                                {work.displayTitle.year}
                                            </span>
                                            <span className="expandIcon">
                                                {expandedCollections.has(work.id) ? '▼' : '▶'}
                                            </span>
                                        </Link>
                                        {expandedCollections.has(work.id) && work.movies && (
                                            <ul className="collectionMoviesList">
                                                {work.movies
                                                    .sort((a, b) => new Date(a.release_date) - new Date(b.release_date))
                                                    .map(movie => (
                                                        <li key={movie.id} className="collectionMovieItem">
                                                            <Link
                                                                to={`/movie/${movie.id}`}
                                                                className="notableWorkLink movie"
                                                            >
                                                                <span className="title-text">
                                                                    {movie.title}
                                                                </span>
                                                                <span className="year-text">
                                                                    {movie.release_date ? ` ('${new Date(movie.release_date).getFullYear().toString().slice(2)})` : ''}
                                                                </span>
                                                            </Link>
                                                        </li>
                                                    ))}
                                            </ul>
                                        )}
                                    </div>
                                ) : (
                                    <Link
                                        to={`/${work.media_type}/${work.id}`}
                                        className={`notableWorkLink ${work.media_type}`}
                                    >
                                        <span className="title-text">
                                            {work.displayTitle.title}
                                        </span>
                                        <span className="year-text">
                                            {work.displayTitle.year}
                                        </span>
                                    </Link>
                                )}
                            </li>
                        ))}
                    </ul>
                    {notableWorks.length > visibleWorksCount && (
                        <button
                            className="showMoreButton"
                            onClick={handleShowMore}
                        >
                            Show More
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

// Add hover effects
document.addEventListener("DOMContentLoaded", () => {
    const addHoverEffects = () => {
        const profileImages = document.querySelectorAll(".image")
        profileImages.forEach((image) => {
            image.addEventListener("mouseenter", () => {
                const leftBtn = image.querySelector(".imageNavButtonLeft")
                const rightBtn = image.querySelector(".imageNavButtonRight")
                if (leftBtn) leftBtn.style.opacity = "1"
                if (rightBtn) rightBtn.style.opacity = "1"
            })
            image.addEventListener("mouseleave", () => {
                const leftBtn = image.querySelector(".imageNavButtonLeft")
                const rightBtn = image.querySelector(".imageNavButtonRight")
                if (leftBtn) leftBtn.style.opacity = "0"
                if (rightBtn) rightBtn.style.opacity = "0"
            })
        })
    }

    addHoverEffects()
    setInterval(addHoverEffects, 2000)
})

export default ActorCard

