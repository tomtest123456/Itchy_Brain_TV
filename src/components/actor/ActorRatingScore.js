// ========================================
// ActorRatingScore.js
// Component for displaying an actor's weighted rating scores across their career
// Uses the IMDb Top 250 weighted rating formula for calculations
// ========================================

import React, { useMemo } from 'react';
import RatingCircle from '../ratings/RatingCircle';
import { EXCLUDED_TV_GENRES, EXCLUDED_MOVIE_GENRES } from '../../services/tmdb';
import './ActorRatingScore.css';

// Configuration constants for TV Shows
const TV_MIN_VOTES_REQUIRED = 100;   // Minimum votes for reliability
const TV_AVERAGE_RATING = 6.5;       // Average rating across all TV shows
const MIN_EPISODES = 8;              // Minimum episode appearances


// Configuration constants for Movies
const MOVIE_MIN_VOTES_REQUIRED = 500;  // Minimum votes for reliability
const MOVIE_AVERAGE_RATING = 6.8;      // Average rating across all movies

// Credit order weighting for movies
const CREDIT_WEIGHTS = {
    LEAD      : 1.2,   // Order 0-2
    MAJOR     : 1.1,   // Order 3-5
    SUPPORTING: 1.0,   // Order 6-8
    MINOR     : 0.9,   // Order 9-11
    EXTRA     : 0.5    // Order >12
};

/**
 * Get credit weight based on order
 * @param {number} order - Actor's billing order in the movie
 * @returns {number} - Weight factor based on credit order
 */
const getCreditWeight = (order) => {
    if (order <= 2) return CREDIT_WEIGHTS.LEAD;
    if (order <= 5) return CREDIT_WEIGHTS.MAJOR;
    if (order <= 8) return CREDIT_WEIGHTS.SUPPORTING;
    if (order <= 12) return CREDIT_WEIGHTS.MINOR;
    return CREDIT_WEIGHTS.EXTRA;
};

// Title patterns to exclude (from NotableWorksManager.js)
const EXCLUDED_TITLE_PATTERNS = [
    'behind the scenes',
    'making of',
    'special features',
    'greatest hits',
    'extended edition',
    'extended cut',
    'director\'s cut',
    'recap',
    'bloopers',
    'gag reel',
    'deleted scenes',
    'bonus features',
    'commentary',
    'featurette',
    'documentary',
    'interviews',
    'bts',
    'extras',
    'outtakes',
    'promotional',
    'promo',
    'trailer',
    'teaser',
    'sneak peek',
    'preview',
    'anniversary edition',
    'special edition',
    'collector\'s edition',
    'unrated',
    'alternate ending',
    'alternate version'
];

/**
 * Check if a title contains any excluded patterns
 * @param {string} title - The title to check
 * @returns {boolean} - True if title should be excluded
 */
const shouldExcludeTitle = (title) => {
    if (!title) return true;
    const lowerTitle = title.toLowerCase();
    return EXCLUDED_TITLE_PATTERNS.some(pattern => 
        lowerTitle.includes(pattern.toLowerCase())
    );
};

/**
 * Calculate weighted rating using IMDb Top 250 formula for TV Shows
 * @param {number} voteAverage - Average vote score
 * @param {number} voteCount - Number of votes
 * @returns {number} - Weighted rating between 0 and 10
 */
const calculateTVWeightedRating = (voteAverage, voteCount) => {
    if (!voteCount || !voteAverage) return 0;
    
    // IMDb weighted rating formula for TV
    const weight = voteCount / (voteCount + TV_MIN_VOTES_REQUIRED);
    return (weight * voteAverage) + ((1 - weight) * TV_AVERAGE_RATING);
};

/**
 * Calculate weighted rating using IMDb Top 250 formula for Movies
 * @param {number} voteAverage - Average vote score
 * @param {number} voteCount - Number of votes
 * @param {number} creditOrder - Actor's billing order
 * @returns {number} - Weighted rating between 0 and 10
 */
const calculateMovieWeightedRating = (voteAverage, voteCount, creditOrder) => {
    if (!voteCount || !voteAverage) return 0;
    
    // IMDb weighted rating formula for Movies with credit weight
    const weight = voteCount / (voteCount + MOVIE_MIN_VOTES_REQUIRED);
    const baseScore = (weight * voteAverage) + ((1 - weight) * MOVIE_AVERAGE_RATING);
    
    // Apply credit order weight
    return baseScore * getCreditWeight(creditOrder);
};

/**
 * Calculate overall TV show rating for an actor
 * @param {Array} tvCredits - Array of TV show credits
 * @returns {number} - Final weighted rating
 */
const calculateTVShowRating = (tvCredits) => {
    if (!tvCredits?.length) return 0;

    // Filter TV shows based on criteria
    const validShows = tvCredits.filter(show => 
        show.episode_count > MIN_EPISODES &&
        show.original_language === 'en' &&
        !shouldExcludeTitle(show.name) &&
        !EXCLUDED_TV_GENRES.includes(show.genre_ids) &&
        show.vote_count > 0 &&
        show.vote_average > 0
    );

    if (validShows.length === 0) return 0;

    // Calculate weighted ratings for each show
    const weightedRatings = validShows.map(show => ({
        rating: calculateTVWeightedRating(show.vote_average, show.vote_count),
        weight: show.vote_count
    }));

    // Calculate final weighted average
    const totalWeight = weightedRatings.reduce((sum, item) => sum + item.weight, 0);
    const weightedSum = weightedRatings.reduce((sum, item) => sum + (item.rating * item.weight), 0);

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
};

/**
 * Calculate overall movie rating for an actor
 * @param {Array} movieCredits - Array of movie credits
 * @returns {number} - Final weighted rating
 */
const calculateMovieRating = (movieCredits) => {
    if (!movieCredits?.length) return 0;

    // Filter movies based on criteria
    const validMovies = movieCredits.filter(movie => 
        movie.original_language === 'en' &&
        !shouldExcludeTitle(movie.title) &&
        !EXCLUDED_MOVIE_GENRES.includes(movie.genre_ids) &&
        movie.vote_count > 0 &&
        movie.vote_average > 0
    );

    if (validMovies.length === 0) return 0;

    // Calculate weighted ratings for each movie
    const weightedRatings = validMovies.map(movie => ({
        rating: calculateMovieWeightedRating(movie.vote_average, movie.vote_count, movie.order),
        weight: movie.vote_count
    }));

    // Calculate final weighted average
    const totalWeight = weightedRatings.reduce((sum, item) => sum + item.weight, 0);
    const weightedSum = weightedRatings.reduce((sum, item) => sum + (item.rating * item.weight), 0);

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
};

/**
 * ActorRatingScore Component
 * Displays an actor's weighted rating scores using circular progress indicators
 */
const ActorRatingScore = ({ actorDetails }) => {
    // Calculate TV show rating
    const tvRating = useMemo(() => {
        if (!actorDetails?.tv_credits?.cast) return 0;
        return calculateTVShowRating(actorDetails.tv_credits.cast);
    }, [actorDetails]);

    // Calculate movie rating
    const movieRating = useMemo(() => {
        if (!actorDetails?.movie_credits?.cast) return 0;
        return calculateMovieRating(actorDetails.movie_credits.cast);
    }, [actorDetails]);

    // Don't render if no valid ratings
    if (!tvRating && !movieRating) return null;

    return (
        <div className="ratings-container">
            {movieRating > 0 && (
                <div className="rating-item">
                    <RatingCircle value={movieRating * 10} type="movie" />
                    <span className="rating-label">Movies</span>
                </div>
            )}
            {tvRating > 0 && (
                <div className="rating-item">
                    <RatingCircle value={tvRating * 10} type="tv" />
                    <span className="rating-label">TV Shows</span>
                </div>
            )}
        </div>
    );
};

export default ActorRatingScore;

