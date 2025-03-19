// ========================================
// NotableWorksManager.js
// Manages the filtering, scoring, and organization of notable works for actors
// including movies, TV shows, and collections.
// ========================================

import { EXCLUDED_TV_GENRES, EXCLUDED_MOVIE_GENRES } from '../../services/tmdb';

// ========================================
// Configuration
// ========================================

// Minimum number of episodes for TV shows to be considered notable
const MIN_TV_EPISODES = 5;

// Minimum votes required for reliable rating
const MIN_VOTES = 1000;

// Average rating across all movies/shows (fallback)
const AVG_RATING = 7.0;

// Scoring weights for different factors
const SCORING_WEIGHTS = {
    userRating    : 4.0,   // Weighted user rating
    popularity    : 2.0,   // Current popularity score
    voteCount     : 2.0,   // Number of votes (indicates reach)
    revenue       : 1.2,   // Box office/financial success
    creditOrder   : {
        topThree   : 5.0,   // Top 3 billing
        topEight   : 2.0,   // 4-8 billing
        significant: 1.5    // Top 20% but not in above categories
    },
    releaseRecency: 0.5,   // Recent releases get a small boost
    mediaType     : {
        movie     : 1.0,
        tv        : 1.0,
        collection: 2.0    // Collections get higher weight
    }
};

// ========================================
// Filtering Functions
// ========================================

/**
 * Determines if a role is significant enough to be included
 * @param {Object} credit - The credit object containing role information
 * @returns {boolean} - Whether the role is significant
 */
const isSignificantRole = (credit) => {
    if (!credit || !credit.character) return false;

    // Check for excluded roles
    const lowerCharacter = credit.character.toLowerCase();
    if (lowerCharacter.includes('uncredited') || 
        lowerCharacter.includes('self') || 
        //lowerCharacter === 'narrator' ||
        lowerCharacter === 'host') {
        return false;
    }

    // TV Show specific checks
    if (credit.media_type === 'tv') {
        if (!credit.episode_count || credit.episode_count < MIN_TV_EPISODES) {
            return false;
        }

        if (credit.genre_ids?.some(id => EXCLUDED_TV_GENRES.includes(id))) {
            return false;
        }
    }

    // Movie specific checks
    if (credit.media_type === 'movie') {
        const castSize = credit.total_cast_members || 50;
        const cutoff = Math.ceil(castSize * 0.2);
        if (credit.order > cutoff) {
            return false;
        }

        if (credit.genre_ids?.some(id => EXCLUDED_MOVIE_GENRES.includes(id))) {
            return false;
        }
    }

    return true;
};

// ========================================
// Scoring Functions
// ========================================

/**
 * Calculate weighted user rating
 * @param {number} voteAverage - Average vote score
 * @param {number} voteCount - Number of votes
 * @returns {number} - Weighted rating between 0 and 10
 */
const calculateWeightedRating = (voteAverage, voteCount) => {
    if (!voteCount || !voteAverage) return 0;
    const weight = Math.min(voteCount / MIN_VOTES, 1);
    return (weight * voteAverage + (1 - weight) * AVG_RATING) * 
           (1 + Math.log10(Math.max(voteCount / MIN_VOTES, 1)));
};

/**
 * Calculate popularity score
 * @param {number} popularity - Raw popularity value
 * @returns {number} - Normalized popularity score between 0 and 1
 */
const calculatePopularityScore = (popularity) => {
    if (!popularity) return 0;
    return Math.min(Math.log10(popularity + 1) / 3, 1);
};

/**
 * Calculate vote count score
 * @param {number} voteCount - Number of votes
 * @returns {number} - Vote count score between 0 and 1
 */
const calculateVoteCountScore = (voteCount) => {
    if (!voteCount) return 0;
    return Math.min(Math.log10(Math.max(voteCount, 1)) / 7, 1);
};

/**
 * Calculate revenue score
 * @param {Object} work - The work being scored
 * @returns {number} - Revenue score between 0 and 1
 */
const calculateRevenueScore = (work) => {
    const revenue = work.revenue || 0;
    if (!revenue) return 0;
    return Math.min(Math.log10(revenue) / 9, 1);
};

/**
 * Calculate credit order score with tiered weighting
 * @param {number} order - Position in credits
 * @param {number} totalCast - Total number of cast members
 * @returns {number} - Credit order score between 0 and 1, with weighting applied
 */
const calculateCreditOrderScore = (order, totalCast = 50) => {
    if (typeof order !== 'number') return 0;
    
    // Calculate the significance threshold (top 20%)
    const significantThreshold = Math.ceil(totalCast * 0.2);
    
    // Base score calculation
    const baseScore = Math.max(0, 1 - (order / significantThreshold));
    
    // Apply tiered weighting
    if (order <= 3) {
        // Top 3 billing gets highest weight
        return Math.min(baseScore * SCORING_WEIGHTS.creditOrder.topThree, 1);
    } else if (order <= 8) {
        // 4-8 billing gets medium-high weight
        return Math.min(baseScore * SCORING_WEIGHTS.creditOrder.topEight, 1);
    } else if (order <= significantThreshold) {
        // Remaining significant roles get standard weight
        return Math.min(baseScore * SCORING_WEIGHTS.creditOrder.significant, 1);
    }
    
    // Return 0 for non-significant roles
    return 0;
};

/**
 * Calculate recency score
 * @param {string} releaseDate - Release date of the work
 * @returns {number} - Recency score between 0 and 1
 */
const calculateRecencyScore = (releaseDate) => {
    if (!releaseDate) return 0;
    const years = (new Date() - new Date(releaseDate)) / (1000 * 60 * 60 * 24 * 365);
    return Math.max(0, 1 - (years / 50));
};

/**
 * Calculate overall score for a work
 * @param {Object} work - The work to score
 * @returns {number} - Final score determining work's ranking
 */
const calculateOverallScore = (work) => {
    // Calculate component scores
    const weightedRating = calculateWeightedRating(work.vote_average, work.vote_count);
    const popularityScore = calculatePopularityScore(work.popularity);
    const voteCountScore = calculateVoteCountScore(work.vote_count);
    const revenueScore = calculateRevenueScore(work);
    const creditOrderScore = calculateCreditOrderScore(work.order, work.total_cast_members);
    const recencyScore = calculateRecencyScore(work.release_date || work.first_air_date);

    console.log('Score components for:', work.title || work.name, {
        creditOrder: work.order,
        totalCast: work.total_cast_members,
        creditOrderScore,
        weightedRating,
        popularityScore,
        voteCountScore,
        revenueScore,
        recencyScore
    });

    // Apply weights to get base score
    const baseScore = (
        weightedRating * SCORING_WEIGHTS.userRating +
        popularityScore * SCORING_WEIGHTS.popularity +
        voteCountScore * SCORING_WEIGHTS.voteCount +
        revenueScore * SCORING_WEIGHTS.revenue +
        creditOrderScore +  // Credit order weighting is now handled in calculateCreditOrderScore
        recencyScore * SCORING_WEIGHTS.releaseRecency
    );

    // Apply media type weight
    return baseScore * SCORING_WEIGHTS.mediaType[work.media_type || 'movie'];
};

// ========================================
// Processing Functions
// ========================================

/**
 * Process notable works for an actor
 * @param {Object} actorDetails - Actor details including credits
 * @param {string} workFilter - Filter for 'movies', 'tv', or 'both'
 * @returns {Array} - Sorted array of notable works
 */
const processNotableWorks = (actorDetails, workFilter) => {
    console.log('Processing notable works:', { 
        filter: workFilter, 
        hasMovieCredits: !!actorDetails?.movie_credits,
        hasCollections: !!actorDetails?.movie_credits?.collections,
        totalMovies: actorDetails?.movie_credits?.cast?.length,
        collectionsCount: actorDetails?.movie_credits?.collections?.length || 0
    });
    
    if (!actorDetails) return [];

    let works = [];
    const processedIds = new Set(); // Track processed works to prevent duplicates

    // Process movies and collections if showing movies
    if (workFilter === 'movies' || workFilter === 'both') {
        // First add all collections - these are already organized by localCollections.js
        const collections = (actorDetails.movie_credits?.collections || [])
            .map(collection => {
                console.log('Processing collection:', {
                    name: collection.name,
                    movieCount: collection.movies?.length,
                    movies: collection.movies?.map(m => ({
                        title: m.title,
                        id: m.id,
                        character: m.character
                    }))
                });

                // Track all movies in this collection
                collection.movies?.forEach(movie => processedIds.add(movie.id));

                return {
                    ...collection,
                    media_type: 'collection',
                    // Ensure collection metrics are calculated
                    revenue: collection.movies?.reduce((sum, m) => sum + (m.revenue || 0), 0) || 0,
                    vote_count: collection.movies?.reduce((sum, m) => sum + (m.vote_count || 0), 0) || 0,
                    vote_average: collection.movies?.reduce((sum, m) => sum + (m.vote_average || 0), 0) / 
                                (collection.movies?.length || 1) || 0,
                    popularity: Math.max(...(collection.movies?.map(m => m.popularity || 0) || [0])),
                    release_date: collection.movies?.[0]?.release_date
                };
            });

        works.push(...collections);

        // Add remaining individual movies that aren't in collections
        const movies = actorDetails.movie_credits?.cast || [];
        const individualMovies = movies
            .filter(movie => !processedIds.has(movie.id) && isSignificantRole({ ...movie, media_type: 'movie' }))
            .map(movie => ({
                ...movie,
                media_type: 'movie'
            }));

        works.push(...individualMovies);

        console.log('Final works breakdown:', {
            totalWorks: works.length,
            collections: collections.map(c => ({
                name: c.name,
                movieCount: c.movies?.length,
                movies: c.movies?.map(m => m.title)
            })),
            individualMovies: individualMovies.map(m => m.title)
        });
    }

    // Add TV shows if requested
    if (workFilter === 'tv' || workFilter === 'both') {
        const tvShows = (actorDetails.tv_credits?.cast || [])
            .filter(show => 
                !processedIds.has(show.id) && 
                isSignificantRole({ ...show, media_type: 'tv' })
            )
            .map(show => ({
                ...show,
                media_type: 'tv'
            }));

        works.push(...tvShows);
    }

    // Calculate scores and sort
    return works
        .map(work => ({
            ...work,
            score: calculateOverallScore(work)
        }))
        .sort((a, b) => b.score - a.score);
};

// ========================================
// Display Formatting Functions
// ========================================

/**
 * Format a work's title and year for display
 * @param {Object} work - The work to format
 * @returns {Object} - Formatted title and year
 */
const formatWorkDisplay = (work) => {
    const getYear = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? '' : `'${date.getFullYear().toString().slice(2)}`;
    };

    let title = work.title || work.name;
    let year = '';

    if (work.media_type === 'collection') {
        year = ` (x${work.movies?.length || 0})`;
    } else {
        const releaseDate = work.release_date || work.first_air_date;
        year = releaseDate ? ` (${getYear(releaseDate)})` : '';
    }

    return { title, year };
};

// Export all functions that need to be used externally
const NotableWorksManager = {
    processNotableWorks,
    formatWorkDisplay,
    calculateOverallScore,
    isSignificantRole,
    SCORING_WEIGHTS
};

export default NotableWorksManager; 