// ========================================
// ActorDetails.js
// This component displays detailed information about an actor including their
// biography, filmography, and personal information using Bulma's styling system.
// ========================================

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchPersonDetails } from "../../services/tmdb";
import { formatDate, calculateAge } from "../../utils/helpers";
import Navbar from "../../components/common/Navbar";

/**
 * ActorDetails Component
 * Displays comprehensive information about an actor including their photos,
 * biography, filmography, and personal details
 */
const ActorDetails = () => {
    // ========================================
    // State Management
    // ========================================
    
    const { actorId } = useParams();
    const navigate = useNavigate();
    const [actor, setActor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // ========================================
    // Data Fetching
    // ========================================
    
    useEffect(() => {
        const loadActorDetails = async () => {
            try {
                const data = await fetchPersonDetails(actorId);
                setActor(data);
            } catch (err) {
                setError("Failed to load actor details.");
            } finally {
                setLoading(false);
            }
        };

        loadActorDetails();
    }, [actorId]);

    // ========================================
    // Helper Functions
    // ========================================
    
    // Extract nationality from place of birth
    const getNationality = () => {
        if (!actor?.place_of_birth) return "Unknown";
        const parts = actor.place_of_birth.split(", ");
        return parts[parts.length - 1];
    };

    // Image gallery navigation
    const nextImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    };

    // ========================================
    // Loading and Error States
    // ========================================
    
    if (loading) return (
        <section className="section">
            <div className="container has-text-centered">
                <div className="box">
                    <p className="is-size-4">Loading actor details...</p>
                    <progress className="progress is-primary mt-4" max="100" />
                </div>
            </div>
        </section>
    );

    if (error) return (
        <section className="section">
            <div className="container">
                <div className="notification is-danger">
                    <p className="has-text-centered">{error}</p>
                </div>
            </div>
        </section>
    );

    if (!actor) return (
        <section className="section">
            <div className="container">
                <div className="notification is-warning">
                    <p className="has-text-centered">No actor details available.</p>
                </div>
            </div>
        </section>
    );

    // Get images array for gallery
    const images = actor.images?.profiles || [];
    const hasImages = images.length > 0;

    // ========================================
    // Component Render
    // ========================================
    
    return (
        <>
            <Navbar />
            <section className="section" style={{ paddingTop: "120px" }}>
                <div className="container">
                    {/* Actor Name and Navigation */}
                    <div className="level mb-6">
                        <div className="level-left">
                            <h1 className="title is-2">{actor.name}</h1>
                        </div>
                        <div className="level-right">
                            <button 
                                className="button is-link is-outlined"
                                onClick={() => navigate(`/actor-connections/${actorId}`)}
                            >
                                View Actor Connections
                            </button>
                        </div>
                    </div>

                    <div className="columns is-variable is-8">
                        {/* Left Column - Photos and Info */}
                        <div className="column is-one-third">
                            {/* Photo Gallery Card */}
                            <div className="card mb-6">
                                <div className="card-image">
                                    <div className="is-relative">
                                        {hasImages && (
                                            <div className="is-flex is-justify-content-space-between is-align-items-center p-2" 
                                                 style={{ position: "absolute", width: "100%", zIndex: 1 }}>
                                                <button 
                                                    className="button is-small is-rounded is-light" 
                                                    onClick={prevImage}
                                                    disabled={!hasImages}
                                                >
                                                    Previous
                                                </button>
                                                <button 
                                                    className="button is-small is-rounded is-light" 
                                                    onClick={nextImage}
                                                    disabled={!hasImages}
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        )}
                                        <figure className="image is-2by3">
                                            <img
                                                src={
                                                    hasImages
                                                        ? `https://image.tmdb.org/t/p/w500${images[currentImageIndex].file_path}`
                                                        : actor.profile_path
                                                            ? `https://image.tmdb.org/t/p/w500${actor.profile_path}`
                                                            : "https://via.placeholder.com/500x750?text=No+Image"
                                                }
                                                alt={actor.name}
                                                style={{ objectFit: "cover" }}
                                            />
                                        </figure>
                                    </div>
                                </div>
                            </div>

                            {/* Personal Information Card */}
                            <div className="card">
                                <div className="card-content">
                                    <h2 className="title is-4 mb-4">Personal Information</h2>
                                    <div className="content">
                                        <table className="table is-fullwidth">
                                            <tbody>
                                                <tr>
                                                    <td><strong>Birthday</strong></td>
                                                    <td>{actor.birthday ? formatDate(actor.birthday, "ddth Mon YYYY") : "Unknown"}</td>
                                                </tr>
                                                {actor.deathday && (
                                                    <tr>
                                                        <td><strong>Died</strong></td>
                                                        <td>{formatDate(actor.deathday, "dd Mon YYYY")}</td>
                                                    </tr>
                                                )}
                                                <tr>
                                                    <td><strong>Age</strong></td>
                                                    <td>{actor.birthday ? calculateAge(actor.birthday, new Date().toISOString().split("T")[0]) : "Unknown"}</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Nationality</strong></td>
                                                    <td>{getNationality()}</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Gender</strong></td>
                                                    <td>{actor.gender === 1 ? "Female" : actor.gender === 2 ? "Male" : "Non-Binary"}</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Known For</strong></td>
                                                    <td>{actor.known_for_department || "Unknown"}</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Popularity</strong></td>
                                                    <td>{actor.popularity?.toFixed(1) || "Unknown"}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <div className="has-text-centered mt-4">
                                            <a 
                                                href={`https://www.imdb.com/name/${actor.imdb_id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="button is-link is-outlined is-fullwidth"
                                            >
                                                View on IMDb
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Biography and Filmography */}
                        <div className="column">
                            {/* Biography Section */}
                            <div className="card mb-6">
                                <div className="card-content">
                                    <h2 className="title is-4">Biography</h2>
                                    <div className="content">
                                        {actor.biography || "No biography available."}
                                    </div>
                                </div>
                            </div>

                            {/* Known For Section */}
                            <div className="card mb-6">
                                <div className="card-content">
                                    <h2 className="title is-4">Known For</h2>
                                    {actor.movie_credits?.cast?.length > 0 ? (
                                        <div className="columns is-multiline">
                                            {Object.values(
                                                actor.movie_credits.cast
                                                    .filter(movie => movie.poster_path)
                                                    .sort((a, b) => b.popularity - a.popularity)
                                                    .slice(0, 8)
                                                    .reduce((acc, movie) => {
                                                        if (!acc[movie.id]) {
                                                            acc[movie.id] = {
                                                                ...movie,
                                                                characters: []
                                                            };
                                                        }
                                                        acc[movie.id].characters.push(movie.character);
                                                        return acc;
                                                    }, {})
                                            ).map(movie => (
                                                <div key={movie.id} className="column is-6-tablet is-4-desktop is-3-widescreen">
                                                    <div className="card">
                                                        <div className="card-image">
                                                            <figure className="image is-2by3">
                                                                <img
                                                                    src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                                                                    alt={movie.title}
                                                                    style={{ objectFit: "cover" }}
                                                                />
                                                            </figure>
                                                        </div>
                                                        <div className="card-content">
                                                            <p className="title is-6">{movie.title}</p>
                                                            <p className="subtitle is-7">
                                                                ({new Date(movie.release_date).getFullYear()})
                                                            </p>
                                                            <p className="is-size-7">
                                                                <strong>As:</strong> {movie.characters.join(", ")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p>No known movies available.</p>
                                    )}
                                </div>
                            </div>

                            {/* TV Shows Section */}
                            <div className="card">
                                <div className="card-content">
                                    <h2 className="title is-4">TV Shows</h2>
                                    {actor.tv_credits?.cast?.length > 0 ? (
                                        <div className="columns is-multiline">
                                            {Object.values(
                                                actor.tv_credits.cast
                                                    .filter(show => show.first_air_date && show.poster_path)
                                                    .sort((a, b) => new Date(b.first_air_date) - new Date(a.first_air_date))
                                                    .slice(0, 8)
                                                    .reduce((acc, show) => {
                                                        if (!acc[show.id]) {
                                                            acc[show.id] = {
                                                                ...show,
                                                                characters: []
                                                            };
                                                        }
                                                        acc[show.id].characters.push(show.character);
                                                        return acc;
                                                    }, {})
                                            ).map(show => (
                                                <div key={show.id} className="column is-6-tablet is-4-desktop is-3-widescreen">
                                                    <div className="card">
                                                        <div className="card-image">
                                                            <figure className="image is-2by3">
                                                                <img
                                                                    src={`https://image.tmdb.org/t/p/w342${show.poster_path}`}
                                                                    alt={show.name}
                                                                    style={{ objectFit: "cover" }}
                                                                />
                                                            </figure>
                                                        </div>
                                                        <div className="card-content">
                                                            <p className="title is-6">{show.name}</p>
                                                            <p className="subtitle is-7">
                                                                ({new Date(show.first_air_date).getFullYear()})
                                                            </p>
                                                            <p className="is-size-7">
                                                                <strong>As:</strong> {show.characters.join(", ")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p>No TV show credits available.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default ActorDetails;