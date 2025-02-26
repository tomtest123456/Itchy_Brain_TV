// src/services/tmdb.js

const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

const fetchFromAPI = async (endpoint, params = "") => {
	try {
		const url = `${BASE_URL}${endpoint}?api_key=${API_KEY}${params}`;
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`API Error: ${response.statusText}`);
		}
		return await response.json();
	} catch (error) {
		console.error("TMDB API Error:", error);
		return null;
	}
};

// ################## MOVIE DETAILS ##################
export const fetchMovieDetails = async (movieId) => {
	return fetchFromAPI(`/movie/${movieId}`, "&append_to_response=genres,credits,videos");
};

export const fetchMovieCredits = async (movieId) => {
	return fetchFromAPI(`/movie/${movieId}/credits`);
};

export const fetchMovieVideos = async (movieId) => {
	return fetchFromAPI(`/movie/${movieId}/videos`);
};

export const fetchCollectionDetails = async (collectionId) => {
	return fetchFromAPI(`/collection/${collectionId}`);
};

// ################## PERSON DETAILS ##################
export const fetchPersonDetails = async (personId) => {
	return fetchFromAPI(`/person/${personId}`, "&append_to_response=movie_credits,tv_credits,images");
};

export const fetchPersonMovieCredits = async (personId) => {
	return fetchFromAPI(`/person/${personId}/movie_credits`);
};

// ################## DISCOVER & SEARCH ##################
export const fetchTrendingMovies = async () => {
	return fetchFromAPI("/trending/movie/week");
};

export const fetchPopularActors = async () => {
	return fetchFromAPI("/person/popular");
};

export const searchMovies = async (query) => {
	return fetchFromAPI(`/search/movie`, `&query=${encodeURIComponent(query)}`);
};

export const searchPeople = async (query) => {
	return fetchFromAPI(`/search/person`, `&query=${encodeURIComponent(query)}`);
};

// ################## CONFIG & GENRES ##################
export const fetchGenres = async () => {
	return fetchFromAPI("/genre/movie/list");
};

export const fetchConfiguration = async () => {
	return fetchFromAPI("/configuration");
};
