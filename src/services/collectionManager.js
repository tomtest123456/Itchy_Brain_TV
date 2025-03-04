const { fetchMovieDetails, fetchCollectionDetails } = require('./tmdb');

const COLLECTIONS_KEY = 'movie_collections';
const LAST_UPDATE_KEY = 'collections_last_update';
const UPDATE_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Initialize collections data in localStorage if it doesn't exist
const initializeCollectionsFile = () => {
    if (!localStorage.getItem(COLLECTIONS_KEY)) {
        localStorage.setItem(COLLECTIONS_KEY, JSON.stringify({}));
    }
};

// Get collections data from localStorage
const getCollectionData = () => {
    try {
        const data = localStorage.getItem(COLLECTIONS_KEY);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error('Error reading collections data:', error);
        return {};
    }
};

// Save collections data to localStorage
const saveCollectionData = (data) => {
    try {
        localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(data));
        localStorage.setItem(LAST_UPDATE_KEY, Date.now().toString());
    } catch (error) {
        console.error('Error saving collections data:', error);
    }
};

// Check if collections need to be updated
const needsUpdate = () => {
    const lastUpdate = localStorage.getItem(LAST_UPDATE_KEY);
    if (!lastUpdate) return true;

    const timeSinceLastUpdate = Date.now() - parseInt(lastUpdate);
    return timeSinceLastUpdate > UPDATE_INTERVAL;
};

// Fetch and update collections data
const updateCollections = async () => {
    try {
        console.log('Starting collections update...');
        const collections = {};

        // Fetch popular movies to get collection data
        const popularMovies = await fetchMovieDetails('popular');
        if (!popularMovies?.results) {
            console.error('Failed to fetch popular movies');
            return;
        }

        // Process each movie to get collection data
        for (const movie of popularMovies.results) {
            if (movie.belongs_to_collection) {
                const collectionId = movie.belongs_to_collection.id;
                if (!collections[collectionId]) {
                    const collectionData = await fetchCollectionDetails(collectionId);
                    if (collectionData) {
                        collections[collectionId] = collectionData;
                    }
                }
            }
        }

        // Save updated collections data
        saveCollectionData(collections);
        console.log('Collections update completed');
    } catch (error) {
        console.error('Error updating collections:', error);
    }
};

// Get collection data for a movie
const getMovieCollection = async (movieId) => {
    try {
        // Initialize collections if needed
        initializeCollectionsFile();

        // First check if we have the collection in localStorage
        const collections = getCollectionData();

        // Find collection containing this movie
        for (const collection of Object.values(collections)) {
            if (collection.parts?.some(part => part.id === movieId)) {
                return collection;
            }
        }

        // If not found in localStorage, fetch movie details to check for collection
        const movieDetails = await fetchMovieDetails(movieId);
        if (movieDetails?.belongs_to_collection) {
            const collectionId = movieDetails.belongs_to_collection.id;

            // Check if we already have this collection
            if (collections[collectionId]) {
                return collections[collectionId];
            }

            // Fetch collection details
            const collectionData = await fetchCollectionDetails(collectionId);
            if (collectionData) {
                // Save to localStorage
                collections[collectionId] = collectionData;
                saveCollectionData(collections);
                return collectionData;
            }
        }

        return null;
    } catch (error) {
        console.error('Error getting movie collection:', error);
        return null;
    }
};

// Get collection by ID
const getCollectionById = async (collectionId) => {
    try {
        // Initialize collections if needed
        initializeCollectionsFile();

        // Check if update is needed
        if (needsUpdate()) {
            await updateCollections();
        }

        const collections = getCollectionData();
        return collections[collectionId] || null;
    } catch (error) {
        console.error('Error getting collection by ID:', error);
        return null;
    }
};

module.exports = {
    getMovieCollection,
    getCollectionById,
    updateCollections
}; 