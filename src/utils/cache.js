// Cache utility module with TTL support
class Cache {
    constructor(ttl = 3600000) { // Default TTL: 1 hour
        this.cache = new Map();
        this.ttl = ttl;
    }

    set(key, value) {
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        const now = Date.now();
        if (now - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    has(key) {
        return this.get(key) !== null;
    }

    clear() {
        this.cache.clear();
    }
}

// Create separate cache instances for different types of data
export const tmdbCache = new Cache(3600000); // 1 hour TTL for TMDB data
export const omdbCache = new Cache(86400000); // 24 hours TTL for OMDB data
export const personCache = new Cache(3600000); // 1 hour TTL for person/actor data 

function formatYearAbbrev(year) {
    const date = new Date(year);
    return date.getFullYear();
}

function formatDisplayTitle(movie) {
    if (movie.belongs_to_collection) {
        return {
            title: movie.belongs_to_collection.name,
            year: ""
        };
    } else if (movie.title) {
        return {
            title: movie.title,
            year: movie.release_date ? `(${formatYearAbbrev(movie.release_date)})` : ""
        };
    }
    return null;
} 