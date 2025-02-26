// src/components/movies/MovieDetails.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import "./MovieDetails.css";
import ActorCard from "../../components/movies/ActorCard";
import "../../components/movies/ActorCard.css";


import { fetchMovieDetails, fetchCollectionDetails } from "../../services/tmdb";
import { formatDate, formatCurrency } from "../../utils/helpers";

// ############### MOVIE INFO ###############
const MovieDetails = () => {
	// For testing, movieId is hardcoded; later you can use useParams() to fetch dynamic IDs
	const movieId = "671";

	const [movie, setMovie] = useState(null);
	const [cast, setCast] = useState([]);
	const [director, setDirector] = useState(null);
	const [trailer, setTrailer] = useState(null);
	const [collection, setCollection] = useState(null);
	const [visibleActors, setVisibleActors] = useState(10); // Controls "Show more actors" pagination

	useEffect(() => {
		const loadMovieData = async () => {
			try {
				const movieData = await fetchMovieDetails(movieId);
				if (!movieData) return;

				setMovie(movieData);

				if (movieData.credits?.cast?.length > 0) {
					setCast(movieData.credits.cast);
				}
				if (movieData.credits?.crew?.length > 0) {
					const movieDirector = movieData.credits.crew.find(member => member.job === "Director");
					setDirector(movieDirector || null);
				}
				if (movieData.videos?.results?.length > 0) {
					const movieTrailer = movieData.videos.results.find(video => video.type === "Trailer" && video.site === "YouTube");
					setTrailer(movieTrailer || null);
				}
				if (movieData.belongs_to_collection) {
					const collectionData = await fetchCollectionDetails(movieData.belongs_to_collection.id);
					setCollection(collectionData);
				}
			} catch (error) {
				console.error("Error fetching movie details:", error);
			}
		};

		loadMovieData();
	}, [movieId]);

	if (!movie) return <p>Loading movie details...</p>;

	return (
		<>
			<Navbar /> {/* Navbar at the top */}
			<div className="movie-details-page">

				<div className="movie-header">
					<img
						className="movie-poster"
						src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
						alt={movie.title}
					/>

					<div className="movie-content">
						{/* Movie Title */}
						<h1 className="title is-2 has-text-weight-bold modern-title">
							{movie.title}
							<span className="release-year" style={{ fontWeight: "normal" }}>
								({formatDate(movie.release_date, "YYYY")})
							</span>
						</h1>

						{/* Progress Bar for Rating */}
						<div className="rating-container">
							<span className="rating-text">{Math.round(movie.vote_average * 10)}%</span>
							<progress
								className="progress is-success rating-bar"
								value={movie.vote_average * 10}
								max="100">
							</progress>
						</div>

						{/* Cast Section */}
						<div className="actor-list-container">
							<h2 className="actor-list-title">Cast</h2>
							<div className="actor-list">
								{cast.slice(0, visibleActors).map((actor) => (
									<ActorCard key={actor.id} actor={actor} movieReleaseDate={movie.release_date} />
								))}
							</div>

							{cast.length > visibleActors && (
								<button className="show-more-actors" onClick={() => setVisibleActors(visibleActors + 10)}>
									Show more actors...
								</button>
							)}
						</div>
					</div>
				</div>


				{/* Movie Information */}
				<p><strong>Duration:</strong> {movie.runtime} min</p>
				<p><strong>Budget:</strong> {formatCurrency(movie.budget)}</p>
				<p><strong>Box Office Revenue:</strong> {formatCurrency(movie.revenue)}</p>
				<p><strong>Genres:</strong> {movie.genres.map(genre => genre.name).join(", ")}</p>
				<p><strong>Description:</strong> {movie.overview}</p>

				{director && <p><strong>Director:</strong> {director.name}</p>}

				{/* Trailer Link */}
				{trailer && (
					<div>
						<h2>Trailer</h2>
						<a
							href={`https://www.youtube.com/watch?v=${trailer.key}`}
							target="_blank"
							rel="noopener noreferrer"
							className="trailer-link"
						>
							Watch Trailer on YouTube
						</a>
					</div>
				)}

				{/* Other Movies in the Collection */}
				{collection && (
					<div>
						<h2>Other Movies in This Series</h2>
						<ul>
							{collection.parts.map(part => (
								<li key={part.id}>{part.title} ({formatDate(part.release_date, "YYYY")})</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</>
	);
};

export default MovieDetails;
