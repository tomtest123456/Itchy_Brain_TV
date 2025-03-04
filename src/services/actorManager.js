const { fetchPersonDetails, fetchPopularActors } = require('./tmdb');

const ACTORS_KEY = 'actor_details';
const LAST_UPDATE_KEY = 'actors_last_update';
const UPDATE_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const MAX_CACHE_SIZE = 100; // Maximum number of actors to cache

// Initialize actors data in localStorage if it doesn't exist
const initializeActorsFile = () => {
    if (!localStorage.getItem(ACTORS_KEY)) {
        localStorage.setItem(ACTORS_KEY, JSON.stringify({}));
    }
    if (!localStorage.getItem(LAST_UPDATE_KEY)) {
        localStorage.setItem(LAST_UPDATE_KEY, '0');
    }
};

// Get actors data from localStorage
const getActorData = () => {
    try {
        const data = localStorage.getItem(ACTORS_KEY);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error('Error reading actors data:', error);
        return {};
    }
};

// Save actors data to localStorage
const saveActorData = (data) => {
    try {
        // Ensure we don't exceed the maximum cache size
        const actorIds = Object.keys(data);
        if (actorIds.length > MAX_CACHE_SIZE) {
            // Remove oldest entries to maintain cache size
            const sortedIds = actorIds.sort((a, b) => {
                const dateA = data[a]._lastAccessed || 0;
                const dateB = data[b]._lastAccessed || 0;
                return dateA - dateB;
            });

            const idsToRemove = sortedIds.slice(0, actorIds.length - MAX_CACHE_SIZE);
            idsToRemove.forEach(id => delete data[id]);
        }

        localStorage.setItem(ACTORS_KEY, JSON.stringify(data));
        localStorage.setItem(LAST_UPDATE_KEY, Date.now().toString());
    } catch (error) {
        console.error('Error saving actors data:', error);
        // If storage is full, clear it and try again
        if (error.name === 'QuotaExceededError') {
            clearActorCache();
            try {
                localStorage.setItem(ACTORS_KEY, JSON.stringify(data));
                localStorage.setItem(LAST_UPDATE_KEY, Date.now().toString());
            } catch (retryError) {
                console.error('Error saving actors data after cache clear:', retryError);
            }
        }
    }
};

// Check if actors need to be updated
const needsUpdate = () => {
    const lastUpdate = localStorage.getItem(LAST_UPDATE_KEY);
    if (!lastUpdate) return true;

    const timeSinceLastUpdate = Date.now() - parseInt(lastUpdate);
    return timeSinceLastUpdate > UPDATE_INTERVAL;
};

// Clear the actor cache
const clearActorCache = () => {
    try {
        localStorage.removeItem(ACTORS_KEY);
        localStorage.removeItem(LAST_UPDATE_KEY);
        initializeActorsFile();
        console.log('Actor cache cleared successfully');
    } catch (error) {
        console.error('Error clearing actor cache:', error);
    }
};

// Fetch and update actors data
const updateActors = async () => {
    try {
        console.log('Starting actors update...');
        const actors = getActorData();

        // Fetch popular actors to update cache
        const popularActors = await fetchPopularActors();
        if (!popularActors?.results) {
            console.error('Failed to fetch popular actors');
            return;
        }

        // Process each actor to get detailed data
        const actorPromises = popularActors.results.map(async (actor) => {
            if (!actors[actor.id]) {
                const actorData = await fetchPersonDetails(actor.id);
                if (actorData) {
                    actors[actor.id] = {
                        ...actorData,
                        _lastAccessed: Date.now()
                    };
                }
            }
            return actor.id;
        });

        await Promise.all(actorPromises);

        // Save updated actors data
        saveActorData(actors);
        console.log('Actors update completed');
    } catch (error) {
        console.error('Error updating actors:', error);
    }
};

// Get actor details by ID
const getActorById = async (actorId) => {
    try {
        // Initialize actors if needed
        initializeActorsFile();

        const actors = getActorData();

        // Check if we have the actor in cache
        if (actors[actorId]) {
            // Update last accessed time
            actors[actorId]._lastAccessed = Date.now();
            saveActorData(actors);
            return actors[actorId];
        }

        // If not in cache, fetch from API and cache it
        const actorData = await fetchPersonDetails(actorId);
        if (actorData) {
            actors[actorId] = {
                ...actorData,
                _lastAccessed: Date.now()
            };
            saveActorData(actors);
            return actorData;
        }

        return null;
    } catch (error) {
        console.error('Error getting actor by ID:', error);
        return null;
    }
};

// Get multiple actors by their IDs
const getActorsByIds = async (actorIds) => {
    try {
        // Initialize actors if needed
        initializeActorsFile();

        const actors = getActorData();
        const results = {};
        const missingIds = [];

        // Check cache first
        actorIds.forEach(id => {
            if (actors[id]) {
                results[id] = actors[id];
                actors[id]._lastAccessed = Date.now();
            } else {
                missingIds.push(id);
            }
        });

        // Fetch missing actors in parallel
        if (missingIds.length > 0) {
            const fetchPromises = missingIds.map(async id => {
                const actorData = await fetchPersonDetails(id);
                if (actorData) {
                    results[id] = actorData;
                    actors[id] = {
                        ...actorData,
                        _lastAccessed: Date.now()
                    };
                }
            });

            await Promise.all(fetchPromises);
            saveActorData(actors);
        } else if (Object.keys(results).length > 0) {
            // If we only had cache hits, still save the updated access times
            saveActorData(actors);
        }

        return results;
    } catch (error) {
        console.error('Error getting multiple actors:', error);
        return {};
    }
};

// Check if the cache needs maintenance and perform it if necessary
const performCacheMaintenance = () => {
    try {
        const actors = getActorData();
        const now = Date.now();
        let needsSave = false;

        // Remove entries older than UPDATE_INTERVAL
        Object.entries(actors).forEach(([id, data]) => {
            if (now - (data._lastAccessed || 0) > UPDATE_INTERVAL) {
                delete actors[id];
                needsSave = true;
            }
        });

        if (needsSave) {
            saveActorData(actors);
        }
    } catch (error) {
        console.error('Error performing cache maintenance:', error);
    }
};

module.exports = {
    getActorById,
    getActorsByIds,
    updateActors,
    clearActorCache,
    performCacheMaintenance
}; 