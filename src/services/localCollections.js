import collections from '../data/collections.json';

// In-memory cache of collection data
let collectionsCache = null;
let movieToCollectionCache = null;

/**
 * Initialize the collections cache
 */
const initializeCache = () => {
    if (!collectionsCache) {
        collectionsCache = new Map(Object.entries(collections));

        // Build movie to collection mapping cache
        movieToCollectionCache = new Map();
        for (const [collectionId, collection] of collectionsCache) {
            if (collection.parts) {
                for (const movie of collection.parts) {
                    movieToCollectionCache.set(movie.id.toString(), {
                        collectionId: parseInt(collectionId),
                        collectionName: collection.name,
                        movieCount: collection.parts.length
                    });
                }
            }
        }
    }
};

/**
 * Get collection details by ID
 * @param {number} collectionId - The collection ID to look up
 * @returns {Object|null} The collection details or null if not found
 */
export const getCollectionById = (collectionId) => {
    initializeCache();
    return collectionsCache.get(collectionId.toString()) || null;
};

/**
 * Check if a movie belongs to a collection and get the collection details
 * @param {Object} movie - The movie object
 * @returns {Object|null} The collection details or null if the movie doesn't belong to a collection
 */
export const getMovieCollection = (movie) => {
    if (!movie?.belongs_to_collection?.id) {
        return null;
    }
    return getCollectionById(movie.belongs_to_collection.id);
};

/**
 * Get all collections
 * @returns {Map} A map of all collections
 */
export const getAllCollections = () => {
    initializeCache();
    return collectionsCache;
};

/**
 * Organize movie credits into collections where possible
 * @param {Array} movieCredits - Array of movie credits for an actor
 * @returns {Object} Organized credits with collections and individual movies
 */
export const organizeCreditsWithCollections = (movieCredits) => {
    initializeCache();

    // Track movies by collection
    const collectionMovies = new Map(); // collectionId -> array of movies
    const individualMovies = [];

    for (const credit of movieCredits) {
        const movieId = credit.id.toString();
        const collectionInfo = movieToCollectionCache.get(movieId);

        if (collectionInfo) {
            // Add to collection group
            if (!collectionMovies.has(collectionInfo.collectionId)) {
                // Get full collection data
                const collectionData = collectionsCache.get(collectionInfo.collectionId.toString());
                collectionMovies.set(collectionInfo.collectionId, {
                    id: collectionInfo.collectionId,
                    name: collectionInfo.collectionName,
                    totalMovies: collectionInfo.movieCount,
                    movies: [],
                    // Add collection metadata
                    overview: collectionData?.overview || '',
                    poster_path: collectionData?.poster_path || '',
                    backdrop_path: collectionData?.backdrop_path || '',
                    popularity: collectionData?.popularity || 0,
                    vote_average: collectionData?.vote_average || 0,
                    vote_count: collectionData?.vote_count || 0
                });
            }
            collectionMovies.get(collectionInfo.collectionId).movies.push(credit);
        } else {
            // Keep as individual movie
            individualMovies.push(credit);
        }
    }

    // Convert collections map to array and filter collections where actor is in multiple movies
    const collections = Array.from(collectionMovies.values())
        .filter(collection => collection.movies.length > 1)
        .map(collection => ({
            ...collection,
            movieCount: collection.movies.length,
            media_type: 'collection',
            movies: collection.movies.sort((a, b) => a.release_date?.localeCompare(b.release_date || ''))
        }));

    // Add back individual movies from collections where actor only appeared once
    const singleMovieCollections = Array.from(collectionMovies.values())
        .filter(collection => collection.movies.length === 1)
        .flatMap(collection => collection.movies);

    return {
        collections,
        individualMovies: [...individualMovies, ...singleMovieCollections].sort((a, b) =>
            (b.release_date || '').localeCompare(a.release_date || '')
        )
    };
}; 