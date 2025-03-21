// ========================================
// ActorCarouselCard.js
// This component displays a movie card in the actor's carousel
// including movie poster, title, year, rating, and character info
// ========================================

import React from 'react';
import { Link } from 'react-router-dom';
import './ActorCarouselCard.css';

/**
 * Calculate rating color based on score
 * @param {number} rating - Movie rating
 * @returns {string} - CSS color class
 */
const getRatingColorClass = (rating) => {
    if (!rating) return 'rating-none';
    if (rating >= 8.0) return 'rating-excellent';
    if (rating >= 7.0) return 'rating-good';
    if (rating >= 6.0) return 'rating-average';
    return 'rating-poor';
};

/**
 * Truncate text to fit in specified number of lines
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} - Truncated text
 */
const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength - 2) + '..' : text;
};

const ActorCarouselCard = ({ movie, actorAge }) => {
    if (!movie) return null;

    const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : '';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
    const ratingClass = getRatingColorClass(movie.vote_average);
    
    return (
        <Link to={`/movie/${movie.id}`} className="carousel-card-link">
            <div className="carousel-movie-card">
                <div className="movie-poster">
                    <img 
                        src={movie.poster_path 
                            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                            : 'https://placehold.co/200x300?text=No+Poster'
                        }
                        alt={movie.title}
                        loading="lazy"
                    />
                </div>
                <div className="movie-info">
                    <h3 className="movie-title" title={movie.title}>
                        {truncateText(movie.title)}
                    </h3>
                    <div className="movie-metadata">
                        <span className="release-year">{releaseYear}</span>
                        {rating && (
                            <span className={`movie-rating ${ratingClass}`}>
                                {rating}
                            </span>
                        )}
                    </div>
                    {movie.character && (
                        <p className="character-info">
                            {truncateText(movie.character, 30)}
                            {actorAge && <span className="actor-age">[{actorAge}]</span>}
                        </p>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default ActorCarouselCard;
