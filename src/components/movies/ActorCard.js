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

    useEffect(() => {
        const loadActorDetails = async () => {
            try {
                setIsLoading(true)
                const details = await fetchPersonDetails(actor.id)

                if (details) {
                    setActorDetails(details)

                    // Process movie and TV credits
                    const movieCredits = details.movie_credits?.cast || []
                    const tvCredits = details.tv_credits?.cast || []

                    // Add media_type to each credit
                    const allCredits = [
                        ...movieCredits.map((m) => ({ ...m, media_type: "movie" })),
                        ...tvCredits.map((t) => ({ ...t, media_type: "tv" })),
                    ]

                    // Group by collections first
                    const collections = {}
                    allCredits.forEach((credit) => {
                        if (credit.media_type === "movie" && credit.belongs_to_collection) {
                            const { id, name } = credit.belongs_to_collection
                            if (!collections[id]) {
                                collections[id] = {
                                    id,
                                    name,
                                    count: 0,
                                    movies: [],
                                    earliest_date: null,
                                    popularity: 0,
                                }
                            }
                            collections[id].count++
                            collections[id].movies.push(credit)
                            collections[id].popularity = Math.max(collections[id].popularity, credit.popularity || 0)

                            // Track earliest release date
                            const releaseDate = new Date(credit.release_date)
                            if (!isNaN(releaseDate.getTime())) {
                                if (!collections[id].earliest_date || releaseDate < new Date(collections[id].earliest_date)) {
                                    collections[id].earliest_date = credit.release_date
                                }
                            }
                        }
                    })

                    // Filter standalone works
                    const standaloneWorks = allCredits.filter((credit) => {
                        // Skip current movie, invalid titles, and collected movies
                        if (credit.id === Number.parseInt(currentMovieId)) return false
                        if (!isValidTitle(credit.title || credit.name)) return false
                        if (credit.media_type === "movie" && credit.belongs_to_collection) return false

                        // Filter by genre
                        const genreIds = credit.genre_ids || []
                        if (credit.media_type === "tv" && genreIds.some((id) => EXCLUDED_TV_GENRES.includes(id))) {
                            return false
                        }
                        if (credit.media_type === "movie" && genreIds.some((id) => EXCLUDED_MOVIE_GENRES.includes(id))) {
                            return false
                        }

                        return true
                    })

                    // Convert collections to notable works format
                    const collectionWorks = Object.values(collections)
                        .filter((col) => col.count > 1) // Only include collections with more than one movie
                        .map((col) => ({
                            id: col.id,
                            title: `${col.name} Collection (${col.count})`,
                            release_date: col.earliest_date,
                            media_type: "collection",
                            popularity: col.popularity,
                        }))
                        .sort((a, b) => b.popularity - a.popularity)

                    // Sort standalone works by popularity
                    const sortedStandaloneWorks = standaloneWorks.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))

                    // Combine and format final notable works
                    const combinedWorks = [...collectionWorks, ...sortedStandaloneWorks].slice(0, 5).map((work) => {
                        const title = work.title || work.name
                        const year = formatYear(work.release_date)
                        const displayTitle = year ? `${title} (${year})` : title

                        return {
                            ...work,
                            displayTitle: truncateWithYear(displayTitle, 35),
                        }
                    })

                    setNotableWorks(combinedWorks)
                }
            } catch (error) {
                console.error("Error fetching actor details:", error)
            } finally {
                setIsLoading(false)
            }
        }

        if (actor?.id) {
            loadActorDetails()
        }
    }, [actor?.id, currentMovieId])

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
            <div className="card" style={styles.card}>
                <div className="card-content has-text-centered">
                    <p>Loading actor details...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="card" style={styles.card}>
            <div style={styles.profileImageContainer}>
                <Link to={`/actor/${actor.id}`}>
                    <div className="image" style={styles.profileImage}>
                        <img src={getProfileImageUrl() || "/placeholder.svg"} alt={actor.name} style={styles.profileImageElement} />

                        {actorDetails?.images?.profiles?.length > 1 && (
                            <>
                                <button onClick={handlePrevImage} style={styles.imageNavButtonLeft} className="image-nav-button-left">
                                    &lt;
                                </button>
                                <button onClick={handleNextImage} style={styles.imageNavButtonRight} className="image-nav-button-right">
                                    &gt;
                                </button>
                            </>
                        )}

                        {getNationality() && getCountryCode(getNationality()) && (
                            <div style={styles.flagContainer}>
                                <Flag code={getCountryCode(getNationality())} style={styles.flag} />
                            </div>
                        )}
                    </div>
                </Link>
            </div>

            <div className="card-content" style={styles.cardContent}>
                <Link to={`/actor/${actor.id}`} style={styles.nameLink}>
                    <h3 style={styles.actorName}>
                        <span style={styles.nameText}>{truncateWithYear(actor.name, 20)}</span>
                        {actorDetails?.birthday && <span style={styles.ageDisplay}> ({calculateAge(actorDetails.birthday)})</span>}
                    </h3>
                </Link>

                <p style={styles.characterName}>
                    <span style={styles.characterText}>as {truncateWithYear(actor.character, 25)}</span>
                    {calculateAgeAtFilming() && <span style={styles.ageAtFilming}> ({calculateAgeAtFilming()})</span>}
                </p>

                {notableWorks.length > 0 && (
                    <div style={styles.notableWorksSection}>
                        <p style={styles.notableWorksTitle}>Notable Work:</p>
                        <ul style={styles.notableWorksList}>
                            {notableWorks.map((work) => (
                                <li key={`${work.id}-${work.media_type}`} style={styles.notableWorkItem}>
                                    <Link
                                        to={work.media_type === "collection" ? `/collection/${work.id}` : `/${work.media_type}/${work.id}`}
                                        style={styles.notableWorkLink}
                                    >
                                        {work.displayTitle}
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

const styles = {
    card: {
        backgroundColor: "#2A2D38",
        borderRadius: "8px",
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        border: "1px solid #3900BD",
        transition: "transform 0.2s ease-in-out",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
    },
    profileImageContainer: {
        position: "relative",
        width: "100%",
        paddingTop: "150%",
        overflow: "hidden",
    },
    profileImage: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
    },
    profileImageElement: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "top",
    },
    imageNavButtonLeft: {
        position: "absolute",
        top: "50%",
        left: "10px",
        transform: "translateY(-50%)",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        color: "#FFFFFF",
        border: "none",
        borderRadius: "50%",
        width: "30px",
        height: "30px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        opacity: 0,
        transition: "opacity 0.2s ease-in-out",
        zIndex: 10,
    },
    imageNavButtonRight: {
        position: "absolute",
        top: "50%",
        right: "10px",
        transform: "translateY(-50%)",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        color: "#FFFFFF",
        border: "none",
        borderRadius: "50%",
        width: "30px",
        height: "30px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        opacity: 0,
        transition: "opacity 0.2s ease-in-out",
        zIndex: 10,
    },
    flagContainer: {
        position: "absolute",
        bottom: "10px",
        right: "10px",
        width: "40px",
        height: "30px",
        opacity: 0.8,
        borderRadius: "4px",
        overflow: "hidden",
        zIndex: 5,
    },
    flag: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },
    cardContent: {
        padding: "15px",
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
    },
    nameLink: {
        textDecoration: "none",
        color: "#FFFFFF",
    },
    actorName: {
        fontSize: "1.2rem",
        fontWeight: "bold",
        marginBottom: "5px",
        color: "#FFFFFF",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    nameText: {
        display: "inline-block",
        maxWidth: "calc(100% - 60px)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        verticalAlign: "bottom",
    },
    ageDisplay: {
        fontWeight: "normal",
        fontSize: "0.9rem",
        color: "#DCDCDC",
    },
    characterName: {
        fontSize: "1rem",
        marginBottom: "10px",
        color: "#DCDCDC",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    characterText: {
        display: "inline-block",
        maxWidth: "calc(100% - 60px)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        verticalAlign: "bottom",
    },
    ageAtFilming: {
        fontSize: "0.85rem",
        fontWeight: "normal",
        color: "#DCDCDC",
        opacity: 0.8,
    },
    notableWorksSection: {
        marginTop: "auto",
        paddingTop: "10px",
        borderTop: "1px solid rgba(220, 220, 220, 0.2)",
    },
    notableWorksTitle: {
        fontSize: "0.9rem",
        fontWeight: "bold",
        marginBottom: "5px",
        color: "#DCDCDC",
    },
    notableWorksList: {
        listStyleType: "none",
        padding: 0,
        margin: 0,
    },
    notableWorkItem: {
        fontSize: "0.85rem",
        marginBottom: "3px",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    notableWorkLink: {
        color: "#DCDCDC",
        textDecoration: "none",
        transition: "color 0.2s ease-in-out",
        display: "block",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
}

// Add hover effects
document.addEventListener("DOMContentLoaded", () => {
    const addHoverEffects = () => {
        const profileImages = document.querySelectorAll(".image")
        profileImages.forEach((image) => {
            image.addEventListener("mouseenter", () => {
                const leftBtn = image.querySelector(".image-nav-button-left")
                const rightBtn = image.querySelector(".image-nav-button-right")
                if (leftBtn) leftBtn.style.opacity = "1"
                if (rightBtn) rightBtn.style.opacity = "1"
            })
            image.addEventListener("mouseleave", () => {
                const leftBtn = image.querySelector(".image-nav-button-left")
                const rightBtn = image.querySelector(".image-nav-button-right")
                if (leftBtn) leftBtn.style.opacity = "0"
                if (rightBtn) rightBtn.style.opacity = "0"
            })
        })
    }

    addHoverEffects()
    setInterval(addHoverEffects, 2000)
})

export default ActorCard

