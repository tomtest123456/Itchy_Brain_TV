// src/utils/env.js

export const validateEnvironment = () => {
    const requiredEnvVars = [
        'REACT_APP_TMDB_API_KEY',
        'REACT_APP_TMDB_ACCESS_TOKEN',
        'REACT_APP_OMDB_API_KEY'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        console.error('Missing required environment variables:', missingVars);
        return false;
    }

    console.log('Environment variables validated successfully');
    return true;
};

export const getApiConfig = () => {
    return {
        tmdbApiKey: process.env.REACT_APP_TMDB_API_KEY,
        tmdbAccessToken: process.env.REACT_APP_TMDB_ACCESS_TOKEN,
        omdbApiKey: process.env.REACT_APP_OMDB_API_KEY,
        nodeEnv: process.env.NODE_ENV
    };
}; 