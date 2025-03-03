// src/services/tmdb.js

const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

// Ensure API key exists
if (!API_KEY) {
	console.error("TMDB API Key is missing! Make sure REACT_APP_TMDB_API_KEY is set.");
}

// Helper function to make API requests
const fetchFromAPI = async (endpoint, params = "") => {
	try {
		const url = `${BASE_URL}${endpoint}?api_key=${API_KEY}${params}`;
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`API Error: ${response.status} - ${response.statusText}`);
		}
		return await response.json();
	} catch (error) {
		console.error(`TMDB API Error on ${endpoint}:`, error);
		return null;
	}
};

// ################## MOVIE DETAILS ##################
export const fetchMovieDetails = async (movieId) => {
	return fetchFromAPI(`/movie/${movieId}`, "&append_to_response=genres,credits,videos,images,recommendations,similar,belongs_to_collection");
};

export const fetchMovieCredits = async (movieId) => {
	return fetchFromAPI(`/movie/${movieId}/credits`);
};

export const fetchMovieVideos = async (movieId) => {
	return fetchFromAPI(`/movie/${movieId}/videos`);
};

export const fetchMovieImages = async (movieId) => {
	return fetchFromAPI(`/movie/${movieId}/images`);
};

export const fetchMovieRecommendations = async (movieId) => {
	return fetchFromAPI(`/movie/${movieId}/recommendations`);
};

export const fetchSimilarMovies = async (movieId) => {
	return fetchFromAPI(`/movie/${movieId}/similar`);
};

// ################## TV SHOW DETAILS ##################
export const fetchTvShowDetails = async (tvId) => {
	return fetchFromAPI(`/tv/${tvId}`, "&append_to_response=genres,credits,videos,images,recommendations,similar");
};

export const fetchTvShowCredits = async (tvId) => {
	return fetchFromAPI(`/tv/${tvId}/credits`);
};

export const fetchTvShowVideos = async (tvId) => {
	return fetchFromAPI(`/tv/${tvId}/videos`);
};

export const fetchTvShowImages = async (tvId) => {
	return fetchFromAPI(`/tv/${tvId}/images`);
};

export const fetchTvShowRecommendations = async (tvId) => {
	return fetchFromAPI(`/tv/${tvId}/recommendations`);
};

export const fetchSimilarTvShows = async (tvId) => {
	return fetchFromAPI(`/tv/${tvId}/similar`);
};

// ################## COLLECTION DETAILS ##################
export const fetchCollectionDetails = async (collectionId) => {
	return fetchFromAPI(`/collection/${collectionId}`);
};

// ################## PERSON DETAILS (ACTORS) ##################
export const fetchPersonDetails = async (personId) => {
	const details = await fetchFromAPI(`/person/${personId}`, "&append_to_response=movie_credits,tv_credits,images");

	if (details?.movie_credits?.cast) {
		// Fetch collection details for each movie
		const moviesWithCollections = await Promise.all(
			details.movie_credits.cast.map(async (movie) => {
				const movieDetails = await fetchMovieDetails(movie.id);
				return {
					...movie,
					belongs_to_collection: movieDetails?.belongs_to_collection || null
				};
			})
		);
		details.movie_credits.cast = moviesWithCollections;
	}

	return details;
};

export const fetchPersonMovieCredits = async (personId) => {
	return fetchFromAPI(`/person/${personId}/movie_credits`);
};

export const fetchPersonTvCredits = async (personId) => {
	return fetchFromAPI(`/person/${personId}/tv_credits`);
};

export const fetchPersonImages = async (personId) => {
	return fetchFromAPI(`/person/${personId}/images`);
};

// ################## DISCOVER & SEARCH ##################
export const fetchTrendingMovies = async () => {
	return fetchFromAPI("/trending/movie/week");
};

export const fetchTrendingTvShows = async () => {
	return fetchFromAPI("/trending/tv/week");
};

export const fetchTrendingPeople = async () => {
	return fetchFromAPI("/trending/person/week");
};

export const fetchPopularMovies = async () => {
	return fetchFromAPI("/movie/popular");
};

export const fetchPopularTvShows = async () => {
	return fetchFromAPI("/tv/popular");
};

export const fetchPopularActors = async () => {
	return fetchFromAPI("/person/popular");
};

export const fetchTopRatedMovies = async () => {
	return fetchFromAPI("/movie/top_rated");
};

export const fetchTopRatedTvShows = async () => {
	return fetchFromAPI("/tv/top_rated");
};

export const fetchNowPlayingMovies = async () => {
	return fetchFromAPI("/movie/now_playing");
};

export const fetchUpcomingMovies = async () => {
	return fetchFromAPI("/movie/upcoming");
};

export const searchMovies = async (query) => {
	return fetchFromAPI(`/search/movie`, `&query=${encodeURIComponent(query)}`);
};

export const searchTvShows = async (query) => {
	return fetchFromAPI(`/search/tv`, `&query=${encodeURIComponent(query)}`);
};

export const searchPeople = async (query) => {
	return fetchFromAPI(`/search/person`, `&query=${encodeURIComponent(query)}`);
};

// ################## CONFIG & GENRES ##################
export const fetchGenres = async () => {
	return fetchFromAPI("/genre/movie/list");
};

export const fetchTvGenres = async () => {
	return fetchFromAPI("/genre/tv/list");
};

export const fetchConfiguration = async () => {
	return fetchFromAPI("/configuration");
};

// ################## WATCH PROVIDERS ##################
export const fetchMovieWatchProviders = async (movieId) => {
	return fetchFromAPI(`/movie/${movieId}/watch/providers`);
};

export const fetchTvShowWatchProviders = async (tvId) => {
	return fetchFromAPI(`/tv/${tvId}/watch/providers`);
};

// ################## NETWORK DETAILS ##################
export const fetchNetworkDetails = async (networkId) => {
	return fetchFromAPI(`/network/${networkId}`);
};

// ################## COMPANY DETAILS ##################
export const fetchCompanyDetails = async (companyId) => {
	return fetchFromAPI(`/company/${companyId}`);
};

// ################## EXCLUDED GENRES ##################
export const EXCLUDED_TV_GENRES = [
	10767, // Talk Show
	10763, // News
	99,    // Documentary
	10764, // Reality
	10766  // Soap
];

export const EXCLUDED_MOVIE_GENRES = [
	99,    // Documentary
	10770  // TV Movie
];
