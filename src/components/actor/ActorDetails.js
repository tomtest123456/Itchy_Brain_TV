// ========================================
// ActorDetails.js
// This component displays detailed information about an actor including
// profile picture, name, and other metadata using Bulma's styling system.
// ========================================

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { fetchPersonDetails } from "../../services/tmdb";
import ActorRatingScore from "./ActorRatingScore";
import ActorDetailsInfo from "./ActorDetailsInfo";
import ActorCarousel from "./ActorCarousel";
import './ActorDetails.css';

/**
 * ActorDetails Component
 * Displays comprehensive information about an actor including profile picture,
 * name, and other metadata
 */
const ActorDetails = () => {
    // ========================================
    // State Management
    // ========================================
    const { id } = useParams();
    const [actor, setActor] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loadedImages, setLoadedImages] = useState(new Set());
    const infoContainerRef = useRef(null);

    // ========================================
    // Data Fetching
    // ========================================
    useEffect(() => {
        const loadActorData = async () => {
            try {
                const actorData = await fetchPersonDetails(id);
                if (!actorData) return;
                setActor(actorData);
            } catch (error) {
                console.error("Error fetching actor details:", error);
            }
        };

        if (id) {
            loadActorData();
        }
    }, [id]);

    // Reset scroll position when actor changes
    useEffect(() => {
        if (infoContainerRef.current) {
            infoContainerRef.current.scrollTop = 0;
        }
    }, [actor?.id]);

    // ========================================
    // Helper Functions
    // ========================================
    const getProfileImageUrl = (index) => {
        if (!actor?.images?.profiles?.length) {
            return actor?.profile_path
                ? `https://image.tmdb.org/t/p/w500${actor.profile_path}`
                : null;
        }

        const profile = actor.images.profiles[index];
        return profile?.file_path
            ? `https://image.tmdb.org/t/p/w500${profile.file_path}`
            : null;
    };

    // Handle image navigation
    const handleImageNav = (direction) => {
        if (!actor?.images?.profiles?.length) return;

        setCurrentImageIndex(prevIndex => {
            const totalImages = actor.images.profiles.length;
            if (direction === 'next') {
                return (prevIndex + 1) % totalImages;
            } else {
                return prevIndex === 0 ? totalImages - 1 : prevIndex - 1;
            }
        });
    };

    // ========================================
    // Loading State Handler
    // ========================================
    if (!actor) return (
        <section className="section">
            <div className="container">
                <div className="has-text-centered">
                    <p className="is-size-4">Loading actor details...</p>
                </div>
            </div>
        </section>
    );

    // ========================================
    // Component Render
    // ========================================
    return (
        <section className="section details-section" style={{ paddingTop: "var(--navbar-height)" }}>
            <div className="container">
                <div className="columns is-variable is-0-mobile is-3-tablet is-8-desktop">
                    {/* Left Column - Actor Info */}
                    <div className="column is-one-quarter info-column">
                        <div className="actor-info-container" ref={infoContainerRef}>
                            {/* Actor Profile Picture */}
                            <div className="profileImageContainer">
                                <div className="profileImage">
                                    <img
                                        src={getProfileImageUrl(currentImageIndex)}
                                        alt={actor.name}
                                        className="profileImageElement"
                                    />
                                </div>

                                {actor?.images?.profiles?.length > 1 && (
                                    <>
                                        <button
                                            className="imageNavButton left"
                                            onClick={() => handleImageNav('prev')}
                                            aria-label="Previous image"
                                        >
                                            ◀
                                        </button>
                                        <button
                                            className="imageNavButton right"
                                            onClick={() => handleImageNav('next')}
                                            aria-label="Next image"
                                        >
                                            ▶
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Actor Rating Score */}
                            <ActorRatingScore actorDetails={actor} />

                            {/* Actor Details Info */}
                            <ActorDetailsInfo actorDetails={actor} />
                        </div>
                    </div>

                    {/* Right Column - Name */}
                    <div className="column">
                        <h1 className="title is-3 has-text-weight-bold mb-4 mobile-title">
                            {actor.name}
                        </h1>
                        
                        {/* Notable Movies Section */}
                        <div className="notable-movies-section">
                            <h2 className="title is-4 has-text-weight-bold mb-3">Notable Movies</h2>
                            {actor && (
                                <ActorCarousel 
                                    actorDetails = {actor}
                                    key          = {actor.id}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ActorDetails;
