// ========================================
// ActorDetailsInfo.js
// Component for displaying detailed information about an actor including
// personal details, career statistics, and filmography analysis
// ========================================

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { EXCLUDED_TV_GENRES, EXCLUDED_MOVIE_GENRES } from '../../services/tmdb';
import { formatDate } from '../../utils/helpers';
import './ActorDetailsInfo.css';

// Title patterns to exclude (shared with ActorRatingScore)
const EXCLUDED_TITLE_PATTERNS = [
    'behind the scenes', 'making of', 'special features', 'greatest hits',
    'extended edition', 'extended cut', 'director\'s cut', 'recap',
    'bloopers', 'gag reel', 'deleted scenes', 'bonus features',
    'commentary', 'featurette', 'documentary', 'interviews', 'bts',
    'extras', 'outtakes', 'promotional', 'promo', 'trailer',
    'teaser', 'sneak peek', 'preview', 'anniversary edition',
    'special edition', 'collector\'s edition', 'unrated',
    'alternate ending', 'alternate version'
];

// Genre mapping (add all your genre mappings here)
const GENRE_MAP = {
    28: "Action",
    12: "Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Science Fiction",
    10770: "TV Movie",
    53: "Thriller",
    10752: "War",
    37: "Western",
    // TV Genres
    10759: "Action & Adventure",
    10762: "Kids",
    10763: "News",
    10764: "Reality",
    10765: "Sci-Fi & Fantasy",
    10766: "Soap",
    10767: "Talk",
    10768: "War & Politics"
};

/**
 * Calculate age from date
 * @param {string} birthDate - Date of birth
 * @param {string} [endDate] - Optional end date (for deceased)
 * @returns {number} - Age in years
 */
const calculateAge = (birthDate, endDate = new Date()) => {
    const birth = new Date(birthDate);
    const end = new Date(endDate);
    let age = end.getFullYear() - birth.getFullYear();
    const monthDiff = end.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

/**
 * Filter valid projects based on criteria
 * @param {Array} credits - Array of credits
 * @param {boolean} isMovie - Whether filtering movies or TV shows
 * @returns {Array} - Filtered credits
 */
const filterValidProjects = (credits, isMovie) => {
    if (!credits?.length) return [];

    return credits.filter(credit => {
        const title = isMovie ? credit.title : credit.name;
        const excludedGenres = isMovie ? EXCLUDED_MOVIE_GENRES : EXCLUDED_TV_GENRES;
        const hasExcludedGenre = credit.genre_ids?.some(id => excludedGenres.includes(id));
        const releaseDate = isMovie ? credit.release_date : credit.first_air_date;
        
        return (
            credit.original_language === 'en' &&
            !shouldExcludeTitle(title) &&
            !hasExcludedGenre &&
            releaseDate && // Ensure there is a valid date
            new Date(releaseDate).toString() !== 'Invalid Date' && // Validate date format
            credit.vote_count >= (isMovie ? 100 : 50) && // Minimum vote threshold
            (isMovie ? credit.order <= 12 : credit.episode_count >= 8) // Role significance threshold
        );
    });
};

/**
 * Check if a title should be excluded
 * @param {string} title - Title to check
 * @returns {boolean} - Whether title should be excluded
 */
const shouldExcludeTitle = (title) => {
    if (!title) return true;
    const lowerTitle = title.toLowerCase();
    return EXCLUDED_TITLE_PATTERNS.some(pattern => 
        lowerTitle.includes(pattern.toLowerCase())
    );
};

/**
 * Get top genres from credits
 * @param {Array} credits - Array of credits
 * @returns {Array} - Array of top genres with counts
 */
const getTopGenres = (credits) => {
    const genreCounts = {};
    credits.forEach(credit => {
        credit.genre_ids?.forEach(genreId => {
            if (GENRE_MAP[genreId]) {
                genreCounts[genreId] = (genreCounts[genreId] || 0) + 1;
            }
        });
    });

    return Object.entries(genreCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([genreId, count]) => ({
            genreId: parseInt(genreId),
            genreName: GENRE_MAP[genreId],
            count
        }));
};

/**
 * ActorDetailsInfo Component
 * Displays comprehensive information about an actor's career and personal details
 */
const ActorDetailsInfo = ({ actorDetails }) => {
    // Calculate all actor statistics using useMemo
    const stats = useMemo(() => {
        if (!actorDetails) return null;

        // Filter valid projects
        const validMovies = filterValidProjects(actorDetails.movie_credits?.cast, true);
        const validTVShows = filterValidProjects(actorDetails.tv_credits?.cast, false);

        // Calculate career dates using only valid projects
        const allDates = [
            ...validMovies.map(m => m.release_date),
            ...validTVShows.map(t => t.first_air_date)
        ]
        .filter(Boolean)
        .sort();

        const firstCredit = allDates[0];
        const lastCredit = allDates[allDates.length - 1];
        const careerSpan = firstCredit && lastCredit ? 
            calculateAge(firstCredit, lastCredit) : 0;

        // Movie statistics
        const leadRoles = validMovies.filter(m => m.order === 0).length;
        const majorRoles = validMovies.filter(m => m.order >= 1 && m.order <= 3).length;
        const supportingRoles = validMovies.filter(m => m.order >= 4 && m.order <= 12).length;
        const totalSignificantMovies = validMovies.filter(m => m.order <= 12).length;
        const leadRoleRatio = totalSignificantMovies ? 
            Math.round((leadRoles / totalSignificantMovies) * 100) : 0;

        // TV statistics
        const recurringRoles = validTVShows.filter(show => show.episode_count >= 8).length;
        const totalEpisodes = validTVShows.reduce((sum, show) => sum + (show.episode_count || 0), 0);

        // Genre analysis
        const movieGenres = getTopGenres(validMovies);
        const tvGenres = getTopGenres(validTVShows);

        return {
            firstCredit,
            careerSpan,
            totalMovies: validMovies.length,
            totalTVShows: validTVShows.length,
            leadRoles,
            leadRoleRatio,
            majorRoles,
            supportingRoles,
            totalEpisodes,
            recurringRoles,
            movieGenres,
            tvGenres
        };
    }, [actorDetails]);

    if (!actorDetails || !stats) return null;

    return (
        <div className="info-section">
            {/* General Information */}
            <div className="info-subsection">
                <h2 className="title is-5">General Information</h2>
                
                <div className="info-item">
                    <div className="info-row">
                        <span className="info-label">Born:</span>
                        <span className="info-content">
                            {actorDetails.birthday ? new Date(actorDetails.birthday).getFullYear() : 'N/A'}
                        </span>
                    </div>
                </div>

                {actorDetails.place_of_birth && (
                    <div className="info-item">
                        <div className="info-row">
                            <span className="info-label">Birthplace:</span>
                            <span className="info-content">
                                {actorDetails.place_of_birth.split(', ').pop()}
                            </span>
                        </div>
                    </div>
                )}

                <div className="info-item">
                    <div className="info-row">
                        <span className="info-label">Career Start:</span>
                        <span className="info-content">
                            {stats.firstCredit ? (
                                <>
                                    {new Date(stats.firstCredit).getFullYear()}
                                    <span className="info-content">
                                        ({calculateAge(actorDetails.birthday, stats.firstCredit)})
                                    </span>
                                </>
                            ) : 'N/A'}
                        </span>
                    </div>
                </div>

                <div className="info-item">
                    <div className="info-row">
                        <span className="info-label">Career Span:</span>
                        <span className="info-content">{stats.careerSpan} years</span>
                    </div>
                </div>

                <div className="info-item">
                    <div className="info-row">
                        <span className="info-label">Total Projects:</span>
                        <span className="info-content">{stats.totalMovies + stats.totalTVShows}</span>
                    </div>
                </div>

                <div className="info-item">
                    <div className="info-row">
                        <span className="info-label">Total Movies:</span>
                        <span className="info-content">{stats.totalMovies}</span>
                    </div>
                </div>

                <div className="info-item">
                    <div className="info-row">
                        <span className="info-label">Total TV:</span>
                        <span className="info-content">{stats.totalTVShows}</span>
                    </div>
                </div>
            </div>

            {/* Movie Statistics */}
            <div className="info-subsection">
                <h2 className="title is-5">Movie Statistics</h2>
                
                <div className="info-item">
                    <div className="info-row">
                        <span className="info-label">Lead Roles:</span>
                        <span className="info-content">{stats.leadRoles} ({stats.leadRoleRatio}%)</span>
                    </div>
                </div>

                <div className="info-item">
                    <div className="info-row">
                        <span className="info-label">Major Roles:</span>
                        <span className="info-content">{stats.majorRoles}</span>
                    </div>
                </div>

                <div className="info-item">
                    <div className="info-row">
                        <span className="info-label">Supporting:</span>
                        <span className="info-content">{stats.supportingRoles}</span>
                    </div>
                </div>

                {stats.movieGenres.length > 0 && (
                    <div className="info-item">
                        <div className="info-row">
                            <span className="info-label">Top Genres:</span>
                            <span className="info-content">
                                {stats.movieGenres.map(genre => genre.genreName).join(', ')}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* TV Show Statistics */}
            <div className="info-subsection">
                <h2 className="title is-5">TV Show Statistics</h2>
                
                <div className="info-item">
                    <div className="info-row">
                        <span className="info-label">Total Shows:</span>
                        <span className="info-content">{stats.totalTVShows}</span>
                    </div>
                </div>

                <div className="info-item">
                    <div className="info-row">
                        <span className="info-label">Total Episodes:</span>
                        <span className="info-content">{stats.totalEpisodes}</span>
                    </div>
                </div>

                <div className="info-item">
                    <div className="info-row">
                        <span className="info-label">Recurring Roles:</span>
                        <span className="info-content">{stats.recurringRoles}</span>
                    </div>
                </div>

                {stats.tvGenres.length > 0 && (
                    <div className="info-item">
                        <div className="info-row">
                            <span className="info-label">Top Genres:</span>
                            <span className="info-content">
                                {stats.tvGenres.map(genre => genre.genreName).join(', ')}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActorDetailsInfo;
