// ========================================
// Ratings.js
// Component for displaying movie ratings from various sources
// Uses OMDB API to fetch IMDb, Rotten Tomatoes, and Metacritic scores
// ========================================

import React, { useState, useEffect } from 'react';
import { fetchMovieRatings } from '../../services/omdb';
import RatingCircle from './RatingCircle';

/**
 * Parse rating value from string to number
 * @param {string} rating - Rating string (e.g., "8.5/10", "85%")
 * @param {string} type - Rating type (imdb, rottenTomatoes, or metacritic)
 * @returns {number} - Parsed rating value
 */
const parseRating = (rating, type = 'default') => {
    console.log('Parsing rating:', { input: rating, type });
    if (!rating) return 0;

    // Handle percentage format (e.g., "85%")
    if (rating.includes('%')) {
        const value = parseInt(rating);
        console.log('Parsed percentage rating:', { input: rating, output: value });
        return value;
    }

    // Handle IMDb format (e.g., "8.5/10")
    if (type === 'imdb') {
        const match = rating.match(/(\d+\.?\d*)/);
        if (match) {
            const value = parseFloat(match[1]);
            console.log('Parsed IMDb rating:', { input: rating, match: match[1], output: value });
            return value;
        }
    }

    // Handle fraction format (e.g., "65/100")
    const fractionMatch = rating.match(/(\d+)\/(\d+)/);
    if (fractionMatch) {
        const [_, numerator, denominator] = fractionMatch;
        const value = (parseInt(numerator) / parseInt(denominator)) * 100;
        console.log('Parsed fraction rating:', { input: rating, numerator, denominator, output: value });
        return value;
    }

    // Handle plain number
    const numericMatch = rating.match(/(\d+\.?\d*)/);
    if (numericMatch) {
        const value = parseFloat(numericMatch[1]);
        console.log('Parsed numeric rating:', { input: rating, output: value });
        return value;
    }

    console.log('Unable to parse rating:', { input: rating });
    return 0;
};

/**
 * Ratings Component
 * Displays movie ratings in circular progress bars
 */
const Ratings = ({ imdbId }) => {
    const [ratings, setRatings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRatings = async () => {
            console.log('Ratings component mounting with IMDb ID:', imdbId);

            if (!imdbId) {
                console.error('No IMDb ID provided to Ratings component');
                setError('No IMDb ID provided');
                setLoading(false);
                return;
            }

            try {
                console.log('Initiating ratings fetch for IMDb ID:', imdbId);
                const data = await fetchMovieRatings(imdbId);
                console.log('Raw ratings data received:', data);

                if (data.Error) {
                    console.error('OMDB API returned error:', data.Error);
                    setError(data.Error);
                    setRatings(null);
                } else if (data.Ratings && data.Ratings.length > 0) {
                    console.log('Processing ratings data:', {
                        imdbRating: data.imdbRating,
                        availableRatings: data.Ratings.map(r => r.Source)
                    });

                    const formattedRatings = {
                        imdb: parseRating(data.imdbRating, 'imdb'),
                        rottenTomatoes: data.Ratings.find(r => r.Source === 'Rotten Tomatoes')?.Value || '0%',
                        metacritic: data.Ratings.find(r => r.Source === 'Metacritic')?.Value || '0/100'
                    };

                    console.log('Formatted ratings:', formattedRatings);
                    setRatings(formattedRatings);
                    setError(null);
                } else {
                    console.warn('No ratings found in OMDB response:', data);
                    setError('No ratings available');
                    setRatings(null);
                }
            } catch (err) {
                console.error('Error in Ratings component:', {
                    message: err.message,
                    stack: err.stack,
                    imdbId: imdbId
                });
                setError(`Failed to fetch ratings: ${err.message}`);
                setRatings(null);
            } finally {
                setLoading(false);
            }
        };

        fetchRatings();
    }, [imdbId]);

    if (loading) {
        return <div className="ratings-loading">Loading ratings...</div>;
    }

    if (error) {
        return <div className="ratings-error">{error}</div>;
    }

    if (!ratings) {
        console.log('No ratings to display');
        return null;
    }

    return (
        <div className="ratings-container">
            <div className="rating-item">
                <RatingCircle value={ratings.imdb} type="imdb" />
                <span className="rating-label">IMDb</span>
            </div>
            {ratings.rottenTomatoes && (
                <div className="rating-item">
                    <RatingCircle value={parseRating(ratings.rottenTomatoes)} type="rottenTomatoes" />
                    <span className="rating-label">Tomatoes</span>
                </div>
            )}
            {ratings.metacritic && (
                <div className="rating-item">
                    <RatingCircle value={parseRating(ratings.metacritic)} type="metacritic" />
                    <span className="rating-label">Metacritic</span>
                </div>
            )}
        </div>
    );
};

export default Ratings; 