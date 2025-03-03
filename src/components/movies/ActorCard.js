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
    const yearMatch = text.match(/$$(\d{4})$$$/)
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
    return start === end ? `(${start})` : `(${start}-${end})`
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
 * Scoring and filtering functions for notable works
 * These functions determine how works are ranked and which ones are included in the actor's notable works list
 */

/**
 * Determines if a role is significant enough to be considered notable work (excludes cameos and one-off appearances)
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
 * Calculates weight based on actor's role prominence (lead vs supporting vs minor)
 * @param {Object} credit - The credit object containing role information
 * @returns {number} - Weight multiplier for the role's importance
 */
const getRoleWeight = (credit) => {
    // Lead role (1st billing) gets highest weight, supporting roles (2-5) get medium, rest get base weight
    return credit.order === 0 ? 3 :
        credit.order < 5 ? 2 : 1;
};

/**
 * Calculates score based on audience reception (combines rating and number of votes)
 * @param {Object} credit - The credit object containing vote information
 * @returns {number} - Score based on vote average and vote count
 */
const getVoteScore = (credit) => {
    const voteAverage = credit.vote_average || 0;
    const voteCount = credit.vote_count || 0;
    // Heavily weight vote_count to favor widely-seen content, but maintain rating influence
    return (voteAverage * Math.log10(voteCount + 1)) / 5;
};

/**
 * Calculates score based on how well the work has maintained relevance over time
 * @param {Object} credit - The credit object containing release date and popularity
 * @returns {number} - Score based on sustained popularity relative to age
 */
const getLegacyScore = (credit) => {
    const releaseDate = credit.release_date || credit.first_air_date;
    if (!releaseDate) return 0;

    const yearsSinceRelease = new Date().getFullYear() - new Date(releaseDate).getFullYear();
    // Higher weight for works that maintain popularity despite age
    return (credit.popularity || 0) * Math.log10(yearsSinceRelease + 1);
};

/**
 * Calculates bonus score for TV shows based on actor's involvement level
 * @param {Object} credit - The credit object containing episode information
 * @returns {number} - Score based on number of episodes actor appears in
 */
const getEpisodeScore = (credit) => {
    const episodeCount = credit.episode_count || 0;
    // Only give significant bonus for shows where actor is a regular (10+ episodes)
    return episodeCount >= 10 ? Math.log10(episodeCount) * 2 : Math.log10(episodeCount);
};

/**
 * Calculates bonus score for movies based on commercial success
 * @param {Object} credit - The credit object containing revenue information
 * @returns {number} - Score based on movie's revenue
 */
const getRevenueScore = (credit) => {
    const revenue = credit.revenue || 0;
    // Use log scale to prevent blockbusters from completely dominating
    return Math.log10(revenue + 1) / 8;
};

/**
 * Calculates overall score for a work to determine its notability
 * @param {Object} credit - The credit object containing all work information
 * @returns {number} - Final score determining work's ranking in notable works list
 */
const calculateOverallScore = (credit) => {
    // Skip scoring if role isn't significant enough
    if (!isSignificantRole(credit)) return 0;

    // Base score from TMDB popularity
    let score = credit.popularity || 0;

    // Add weighted components (adjust multipliers to change importance of each factor)
    score += getRoleWeight(credit) * 25;     // Role prominence (x25)
    score += getVoteScore(credit) * 20;      // Audience reception (x20)
    score += getLegacyScore(credit) * 15;    // Historical significance (x15)

    // Media-specific bonuses
    if (credit.media_type === 'movie') {
        score += getRevenueScore(credit) * 10;  // Box office success (x10)
        score *= 1.2;  // 20% boost to favor movies over TV
    } else if (credit.media_type === 'tv') {
        score += getEpisodeScore(credit) * 5;   // Series involvement (x5)
    }

    return score;
};

/**
 * Groups movies that belong to the same collection and formats their display
 * @param {Array} movies - List of movies to process
 * @param {number} currentMovieId - ID of the movie being viewed
 * @returns {Array} - Movies with collections grouped
 */
const processCollections = (movies, currentMovieId) => {
    // Group movies by collection
    const collections = new Map()
    const standaloneMovies = []

    movies.forEach(movie => {
        if (movie.belongs_to_collection) {
            const collection = collections.get(movie.belongs_to_collection.id) || {
                id: movie.belongs_to_collection.id,
                title: movie.belongs_to_collection.name,
                movies: [],
                media_type: 'collection',
                first_release: null,
                last_release: null,
                max_popularity: 0,
                best_vote_score: 0,
                belongs_to_collection: movie.belongs_to_collection
            }

            collection.movies.push(movie)

            // Track release dates and best scores
            const releaseDate = new Date(movie.release_date)
            if (!collection.first_release || releaseDate < new Date(collection.first_release)) {
                collection.first_release = movie.release_date
            }
            if (!collection.last_release || releaseDate > new Date(collection.last_release)) {
                collection.last_release = movie.release_date
            }

            collection.max_popularity = Math.max(collection.max_popularity, movie.popularity || 0)
            collection.best_vote_score = Math.max(collection.best_vote_score, getVoteScore(movie))

            collections.set(movie.belongs_to_collection.id, collection)
        } else {
            standaloneMovies.push(movie)
        }
    })

    // Convert collections to array format
    const processedCollections = Array.from(collections.values()).map(collection => ({
        ...collection,
        popularity: collection.max_popularity,
        vote_average: collection.best_vote_score,
        movie_count: collection.movies.length,
        release_date: collection.first_release,
        displayTitle: `${collection.title} (x${collection.movies.length}) ${formatDateRange(collection.first_release, collection.last_release)}`
    }))

    return [...processedCollections, ...standaloneMovies]
}

/**
 * ActorCard Component
 * @param {Object} actor - Actor data from TMDB API
 * @param {string} movieReleaseDate - Release date of the movie
 * @param {string} currentMovieId - ID of the current movie being viewed
 */
const ActorCard = ({ actor, movieReleaseDate, currentMovieId }) => {
    const [actorDetails, setActorDetails] = useState(null)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [notableWorks, setNotableWorks] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [workFilter, setWorkFilter] = useState('both')

    const processNotableWorks = (actorDetails) => {
        if (!actorDetails) return [];

        // Combine all credits based on filter
        let allWorks = [];
        const movieCredits = actorDetails.movie_credits?.cast || [];
        const tvCredits = actorDetails.tv_credits?.cast || [];

        // Filter out excluded genres and invalid titles
        const filteredMovies = movieCredits.filter(movie =>
            !movie.genre_ids?.some(id => EXCLUDED_MOVIE_GENRES.includes(id)) &&
            isValidTitle(movie.title) &&
            isSignificantRole(movie)
        );

        const filteredTvShows = tvCredits.filter(show =>
            !show.genre_ids?.some(id => EXCLUDED_TV_GENRES.includes(id)) &&
            isValidTitle(show.name) &&
            isSignificantRole({ ...show, media_type: 'tv' })
        );

        // Process movies with collections and add media_type
        const processedMovies = processCollections(filteredMovies, currentMovieId)
            .map(work => ({ ...work, media_type: work.media_type || 'movie' }));

        // Add media_type to TV shows
        const processedTvShows = filteredTvShows.map(work => ({ ...work, media_type: 'tv' }));

        // Combine works based on filter
        if (workFilter === 'both') {
            allWorks = [...processedMovies, ...processedTvShows];
        } else if (workFilter === 'movies') {
            allWorks = processedMovies;
        } else {
            allWorks = processedTvShows;
        }

        // Filter out duplicates based on ID and media type
        const uniqueWorks = allWorks.reduce((acc, current) => {
            const key = `${current.id}-${current.media_type}`;
            if (!acc.has(key)) {
                acc.set(key, current);
            }
            return acc;
        }, new Map());

        // Sort by overall score and take top 5
        return Array.from(uniqueWorks.values())
            .sort((a, b) => calculateOverallScore(b) - calculateOverallScore(a))
            .slice(0, 5)
            .map(work => {
                // For collections, use the pre-formatted display title
                if (work.media_type === 'collection') {
                    const [title, info] = work.displayTitle.split(' (');
                    return {
                        id: work.id,
                        title: work.title,
                        media_type: work.media_type,
                        displayTitle: {
                            title,
                            year: `(${info}` // This includes both the movie count and year range
                        }
                    };
                }

                // For regular movies and TV shows
                const year = work.release_date || work.first_air_date
                    ? formatYearAbbrev(work.release_date || work.first_air_date)
                    : '';

                return {
                    id: work.id,
                    title: work.title || work.name,
                    media_type: work.media_type,
                    displayTitle: {
                        title: work.title || work.name,
                        year
                    }
                };
            });
    };

    useEffect(() => {
        const loadActorDetails = async () => {
            try {
                setIsLoading(true);
                const details = await fetchPersonDetails(actor.id);

                if (details) {
                    setActorDetails(details);
                    const works = processNotableWorks(details);
                    setNotableWorks(works);
                }
            } catch (error) {
                console.error("Error loading actor details:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (actor?.id) {
            loadActorDetails();
        }
    }, [actor?.id]);

    // Separate useEffect for filter changes
    useEffect(() => {
        if (actorDetails) {
            const filteredWorks = processNotableWorks(actorDetails);
            setNotableWorks(filteredWorks);
        }
    }, [workFilter]);

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

    // Handle image navigation
    const handleNextImage = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (actorDetails?.images?.profiles?.length > 0) {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % actorDetails.images.profiles.length)
        }
    }

    const handlePrevImage = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (actorDetails?.images?.profiles?.length > 0) {
            setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? actorDetails.images.profiles.length - 1 : prevIndex - 1))
        }
    }

    // Get current profile image URL
    const getProfileImageUrl = () => {
        if (actorDetails?.images?.profiles?.length > 0) {
            return `https://image.tmdb.org/t/p/w300${actorDetails.images.profiles[currentImageIndex].file_path}`
        } else if (actor.profile_path) {
            return `https://image.tmdb.org/t/p/w300${actor.profile_path}`
        }
        return "/placeholder-actor.png"
    }

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
                        <img src={getProfileImageUrl() || "/placeholder.svg"} alt={actor.name} className="profileImageElement" />
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

                {notableWorks.length > 0 && (
                    <div className="notableWorksSection">
                        <div className="notableWorksHeader">
                            <p className="notableWorksTitle">Notable Work:</p>
                            <div className="filterButtons">
                                <button
                                    className={`filterButton ${workFilter === 'both' ? 'active' : ''}`}
                                    onClick={() => setWorkFilter('both')}
                                >
                                    Both
                                </button>
                                <button
                                    className={`filterButton ${workFilter === 'movies' ? 'active' : ''}`}
                                    onClick={() => setWorkFilter('movies')}
                                >
                                    Movies
                                </button>
                                <button
                                    className={`filterButton ${workFilter === 'tv' ? 'active' : ''}`}
                                    onClick={() => setWorkFilter('tv')}
                                >
                                    TV
                                </button>
                            </div>
                        </div>
                        <ul className="notableWorksList">
                            {notableWorks.map((work) => (
                                <li key={`${work.id}-${work.media_type}`} className="notableWorkItem">
                                    <Link
                                        to={work.media_type === "collection" ? `/collection/${work.id}` : `/${work.media_type}/${work.id}`}
                                        className="notableWorkLink"
                                    >
                                        <span className={`title-text ${work.media_type === 'collection' ? 'collection-title' : ''}`}>
                                            {work.displayTitle.title}
                                        </span>
                                        <span className="year-text">
                                            {work.displayTitle.year}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
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

