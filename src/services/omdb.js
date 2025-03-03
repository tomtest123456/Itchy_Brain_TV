// ========================================
// omdb.js
// Service for fetching movie ratings from OMDB API
// ========================================

const BASE_URL = 'https://www.omdbapi.com';

// Debug environment variables
console.log('Environment Variables Debug:', {
    NODE_ENV: process.env.NODE_ENV,
    hasOMDBKey: Boolean(process.env.REACT_APP_OMDB_API_KEY),
    envKeys: Object.keys(process.env).filter(key => key.startsWith('REACT_APP_'))
});

// Use environment variable with fallback
const API_KEY = process.env.REACT_APP_OMDB_API_KEY || '48ecc3ac';

/**
 * Fetch movie ratings from OMDB API
 * @param {string} imdbId - IMDb ID of the movie
 * @returns {Promise<Object>} - Movie ratings data
 */
export const fetchMovieRatings = async (imdbId) => {
    if (!imdbId) {
        console.error('No IMDb ID provided to fetchMovieRatings');
        throw new Error('IMDb ID is required');
    }

    // Debug API key configuration
    console.log('API Configuration:', {
        hasApiKey: Boolean(API_KEY),
        keyLength: API_KEY ? API_KEY.length : 0,
        baseUrl: BASE_URL
    });

    const url = `${BASE_URL}/?i=${imdbId}&apikey=${API_KEY}`;
    console.log('OMDB API Request URL:', url.replace(API_KEY, '[HIDDEN]')); // Log URL without exposing API key

    try {
        console.log(`Attempting to fetch ratings for IMDb ID: ${imdbId}`);
        const response = await fetch(url);

        console.log('OMDB API Response Status:', response.status);
        console.log('OMDB API Response Headers:', {
            'Content-Type': response.headers.get('content-type'),
            'Content-Length': response.headers.get('content-length')
        });

        if (!response.ok) {
            throw new Error(`OMDB API responded with status: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log('OMDB API Response Data:', {
            Response: data.Response,
            Error: data.Error,
            Title: data.Title,
            HasRatings: Boolean(data.Ratings),
            RatingsCount: data.Ratings?.length || 0
        });

        if (data.Error) {
            console.error('OMDB API returned error:', data.Error);
            return { Error: data.Error };
        }

        return data;
    } catch (error) {
        console.error('Detailed error fetching from OMDB:', {
            error: error.message,
            stack: error.stack,
            imdbId: imdbId,
            apiKeyExists: Boolean(API_KEY),
            apiKeyLength: API_KEY ? API_KEY.length : 0
        });
        throw new Error(`Failed to fetch movie ratings: ${error.message}`);
    }
}; 