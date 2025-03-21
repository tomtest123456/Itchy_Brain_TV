// ========================================
// ActorCarousel.js
// This component displays a horizontal scrollable carousel of an actor's
// notable movies with responsive design and smooth scrolling
// ========================================

import React, { useState, useRef, useEffect } from 'react';
import ActorCarouselCard from './ActorCarouselCard';
import NotableWorksManager from '../common/NotableWorksManager';
import './ActorCarousel.css';

const ActorCarousel = ({ actorDetails }) => {
    const carouselRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startPosition, setStartPosition] = useState(0);
    const [currentScroll, setCurrentScroll] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);

    // Log actor details on mount and updates
    useEffect(() => {
        console.log('ActorCarousel - Actor Details:', {
            hasData: !!actorDetails,
            id: actorDetails?.id,
            name: actorDetails?.name,
            movieCredits: actorDetails?.movie_credits?.cast?.length,
            birthday: actorDetails?.birthday
        });
    }, [actorDetails]);

    // Get notable movies using NotableWorksManager
    const notableMovies = actorDetails ? 
        NotableWorksManager.processNotableWorks(actorDetails, 'movies')
            .filter(movie => {
                // Skip if movie or title is undefined/null
                if (!movie || !movie.title) return false;
                // Only filter out items that are collections themselves
                return !(movie.title.toLowerCase().includes('collection') && 
                       movie.media_type === 'collection');
            }) : [];

    // Log processed movies with detailed info
    useEffect(() => {
        console.log('ActorCarousel - Notable Movies:', {
            count: notableMovies.length,
            movies: notableMovies.map(movie => ({
                id: movie.id,
                title: movie.title,
                type: movie.media_type,
                isCollection: movie.title.toLowerCase().includes('collection'),
                character: movie.character,
                releaseDate: movie.release_date
            }))
        });
    }, [notableMovies]);

    // Calculate actor's age for each movie
    const calculateAgeAtFilming = (releaseDate) => {
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

    // Update container width on mount and resize
    useEffect(() => {
        const updateWidth = () => {
            if (carouselRef.current) {
                const width = carouselRef.current.getBoundingClientRect().width;
                console.log('Container width updated:', width);
                setContainerWidth(width);
            }
        };

        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    // Simple drag handlers
    const handleDragStart = (e) => {
        setIsDragging(true);
        const position = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        setStartPosition(position);
        setCurrentScroll(carouselRef.current.scrollLeft);
        
        // Disable smooth scrolling during drag
        if (carouselRef.current) {
            carouselRef.current.style.scrollBehavior = 'auto';
        }
        
        console.log('Drag Start:', { 
            position, 
            currentScroll: carouselRef.current.scrollLeft,
            type: e.type
        });
    };

    const handleDragMove = (e) => {
        if (!isDragging || !carouselRef.current) return;
        
        e.preventDefault();
        const position = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        const delta = startPosition - position;
        const sensitivity = 1.2;
        
        // Apply scroll position with bounds checking
        const maxScroll = carouselRef.current.scrollWidth - carouselRef.current.clientWidth;
        const newScrollPosition = Math.max(0, Math.min(currentScroll + delta, maxScroll));
        carouselRef.current.scrollLeft = newScrollPosition;
        
        console.log('Drag Move:', { 
            delta,
            newScrollPosition,
            maxScroll,
            actualScroll: carouselRef.current.scrollLeft,
            type: e.type
        });
    };

    const handleDragEnd = (e) => {
        if (!isDragging) return;
        
        setIsDragging(false);
        
        // Re-enable smooth scrolling after drag
        if (carouselRef.current) {
            carouselRef.current.style.scrollBehavior = 'smooth';
            console.log('Drag End:', { 
                finalScroll: carouselRef.current.scrollLeft,
                type: e.type
            });
        }
    };

    // Add event listeners for mouse leaving window
    useEffect(() => {
        const handleMouseUp = () => {
            if (isDragging) {
                handleDragEnd();
            }
        };

        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, [isDragging]);

    // Handle button scroll
    const handleScroll = (direction) => {
        if (!carouselRef.current) return;
        
        const scrollWidth = containerWidth * 0.8;
        carouselRef.current.scrollBy({
            left: direction * scrollWidth,
            behavior: 'smooth'
        });
        
        console.log('Button Scroll:', { 
            direction, 
            scrollWidth,
            currentScroll: carouselRef.current.scrollLeft 
        });
    };

    // Don't render if no movies
    if (!notableMovies.length) {
        console.log('ActorCarousel - No movies to display');
        return null;
    }

    return (
        <div className="carousel-container">
            {notableMovies.length > 1 && (
                <button 
                    className="carousel-button prev"
                    onClick={() => handleScroll(-1)}
                    aria-label="Previous items"
                >
                    ◀
                </button>
            )}

            <div 
                className="carousel"
                ref={carouselRef}
                onMouseDown={handleDragStart}
                onMouseMove={isDragging ? handleDragMove : null}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={handleDragStart}
                onTouchMove={isDragging ? handleDragMove : null}
                onTouchEnd={handleDragEnd}
            >
                <div className="carousel-track">
                    {notableMovies.map((movie, index) => (
                        <div key={movie.id || index} className="carousel-item">
                            <ActorCarouselCard 
                                movie={movie} 
                                actorAge={calculateAgeAtFilming(movie.release_date)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {notableMovies.length > 1 && (
                <button 
                    className="carousel-button next"
                    onClick={() => handleScroll(1)}
                    aria-label="Next items"
                >
                    ▶
                </button>
            )}
        </div>
    );
};

export default ActorCarousel;
