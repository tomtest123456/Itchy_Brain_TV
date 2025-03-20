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
import NotableWorksManager from "../common/NotableWorksManager";
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
 * Calculate age from a date string
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {number|null} - Age in years or null if invalid date
 */
const calculateAge = (dateString) => {
    if (!dateString) return null;
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
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
            const works = NotableWorksManager.processNotableWorks(actorDetails, workFilter);
            console.log('Setting notable works:', {
                total: works.length,
                visible: visibleWorksCount,
                hasShowMoreButton: works.length > visibleWorksCount
            });
            setNotableWorks(works);
        }
    }, [actorDetails, workFilter]);

    // Fetch actor details if not provided
    useEffect(() => {
        const fetchDetails = async () => {
            if (!actor?.id) return;
            try {
                const details = await fetchPersonDetails(actor.id);
                setActorDetails(details);
            } catch (error) {
                console.error('Error fetching actor details:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (!preloadedDetails) {
            fetchDetails();
        }
    }, [actor?.id, preloadedDetails]);

    // Calculate actor's age during filming for a specific release date
    const calculateAgeAtFilming = (releaseDate) => {
        console.log('Calculating age with:', {
            birthday: actorDetails?.birthday,
            releaseDate: releaseDate,
            isValidDate: releaseDate && !isNaN(new Date(releaseDate).getTime())
        });

        if (!actorDetails?.birthday || !releaseDate) return null;
        const birthDate = new Date(actorDetails.birthday);
        const filmingDate = new Date(releaseDate);
        if (isNaN(filmingDate.getTime())) return null;
        
        let age = filmingDate.getFullYear() - birthDate.getFullYear();
        const m = filmingDate.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && filmingDate.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    // Get nationality from place of birth
    const getNationality = () => {
        if (!actorDetails?.place_of_birth) return null;
        const parts = actorDetails.place_of_birth.split(", ");
        return parts[parts.length - 1];
    };

    // Map country name to country code
    const getCountryCode = (countryName) => {
        if (!countryName) return null;

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
        };

        return countryMap[countryName] || null;
    };

    // Function to preload an image
    const preloadImage = (url) => {
        if (!url || loadedImages.has(url)) return;

        const img = new Image();
        img.onload = () => {
            setLoadedImages(prev => new Set([...prev, url]));
        };
        img.src = url;
    };

    // Get profile image URL
    const getProfileImageUrl = (index) => {
        if (!actorDetails?.images?.profiles?.length) {
            return actor.profile_path
                ? `https://image.tmdb.org/t/p/w500${actor.profile_path}`
                : null;
        }

        const profile = actorDetails.images.profiles[index];
        return profile?.file_path
            ? `https://image.tmdb.org/t/p/w500${profile.file_path}`
            : null;
    };

    // Handle image navigation
    const handleImageNav = (direction) => {
        if (!actorDetails?.images?.profiles?.length) return;

        setCurrentImageIndex(prevIndex => {
            const totalImages = actorDetails.images.profiles.length;
            if (direction === 'next') {
                return (prevIndex + 1) % totalImages;
            } else {
                return prevIndex === 0 ? totalImages - 1 : prevIndex - 1;
            }
        });
    };

    // Handle image load error
    const handleImageError = () => {
        setImageLoadError(true);
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
        );
    }

    return (
        <div className="card">
            <div className="profileImageContainer">
                <Link to={`/actor/${actor.id}`} className="profileImage">
                    <img
                        src={getProfileImageUrl(currentImageIndex)}
                        alt={actor.name}
                        className="profileImageElement"
                        onError={handleImageError}
                    />
                </Link>

                {actorDetails?.images?.profiles?.length > 1 && (
                    <>
                        <button
                            className="imageNavButton left"
                            onClick={(e) => {
                                e.preventDefault();
                                handleImageNav('prev');
                            }}
                            aria-label="Previous image"
                        >
                            ◀
                        </button>
                        <button
                            className="imageNavButton right"
                            onClick={(e) => {
                                e.preventDefault();
                                handleImageNav('next');
                            }}
                            aria-label="Next image"
                        >
                            ▶
                        </button>
                    </>
                )}

                {getNationality() && getCountryCode(getNationality()) && (
                    <div className="flagContainer">
                        <Flag
                            code={getCountryCode(getNationality())}
                            className="flag"
                        />
                    </div>
                )}
            </div>

            <div className="cardContent">
                <Link to={`/actor/${actor.id}`} className="nameLink">
                    <h3 className="actorName">
                        <span className="actorName">{truncateWithYear(actor.name, 20)}</span>
                        {actorDetails?.birthday && <span className="ageDisplay"> [{calculateAge(actorDetails.birthday)}]</span>}
                    </h3>
                </Link>

                <p className="characterName">
                    <span className="characterText">as {truncateWithYear(actor.character, 25)}</span>
                    {calculateAgeAtFilming(movieReleaseDate) && <span className="ageAtFilming"> [{calculateAgeAtFilming(movieReleaseDate)}]</span>}
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
                                                {NotableWorksManager.formatWorkDisplay(work).title}
                                            </span>
                                            <span className="year-text">
                                                {NotableWorksManager.formatWorkDisplay(work).year}
                                            </span>
                                            <span className="expandIcon">
                                                {expandedCollections.has(work.id) ? '▼' : '▶'}
                                            </span>
                                        </Link>
                                        {expandedCollections.has(work.id) && work.movies && (
                                            <ul className="collectionMoviesList">
                                                {work.movies
                                                    .sort((a, b) => new Date(a.release_date) - new Date(b.release_date))
                                                    .map(movie => {
                                                        console.log('Collection movie data:', {
                                                            title    : movie.title,
                                                            character: movie.character,
                                                            cast     : movie.cast,
                                                            rawMovie : movie
                                                        });
                                                        return (
                                                            <li key={movie.id} className="collectionMovieItem">
                                                                <Link
                                                                    to={`/movie/${movie.id}`}
                                                                    className="notableWorkLinkCollection movie"
                                                                >
                                                                    <span className="title-text">
                                                                        {movie.title}
                                                                    </span>
                                                                    <span className="year-text">
                                                                        {movie.release_date ? ` ('${new Date(movie.release_date).getFullYear().toString().slice(2)})` : ''}
                                                                    </span>
                                                                    {movie.character && (
                                                                        <span className="character-name">
                                                                            {movie.character} {(() => {
                                                                                console.log('Collection movie age calculation:', {
                                                                                    movieTitle : movie.title,
                                                                                    releaseDate: movie.release_date,
                                                                                    character  : movie.character
                                                                                });
                                                                                const age = calculateAgeAtFilming(movie.release_date);
                                                                                return age ? `[${age}]` : '';
                                                                            })()}
                                                                        </span>
                                                                    )}
                                                                </Link>
                                                            </li>
                                                        );
                                                    })}
                                            </ul>
                                        )}
                                    </div>
                                ) : (
                                    <Link
                                        to={`/${work.media_type}/${work.id}`}
                                        className={`notableWorkLink ${work.media_type}`}
                                        ref={el => {
                                            if (el) {
                                                console.log('Link element metrics:', {
                                                    workId        : work.id,
                                                    title         : NotableWorksManager.formatWorkDisplay(work).title,
                                                    containerWidth: el.offsetWidth,
                                                    contentWidth  : el.scrollWidth,
                                                    isOverflowing : el.scrollWidth > el.offsetWidth
                                                });
                                            }
                                        }}
                                    >
                                        <span className="title-text">
                                            {NotableWorksManager.formatWorkDisplay(work).title}
                                        </span>
                                        <span className="year-text">
                                            {NotableWorksManager.formatWorkDisplay(work).year}
                                        </span>
                                        {work.character && (
                                            <span className="character-name">
                                                {work.character} {(() => {
                                                    console.log('Individual work age calculation:', {
                                                        workTitle: work.title || work.name,
                                                        releaseDate: work.release_date || work.first_air_date,
                                                        character: work.character
                                                    });
                                                    const age = calculateAgeAtFilming(work.release_date || work.first_air_date);
                                                    return age ? `[${age}]` : '';
                                                })()}
                                            </span>
                                        )}
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
    );
};

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

