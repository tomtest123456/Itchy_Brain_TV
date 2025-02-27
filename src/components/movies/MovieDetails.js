// src/components/movies/MovieDetails.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import "./MovieDetails.css";
import ActorCard from "../../components/movies/ActorCard";
import "../../components/movies/ActorCard.css";
import { fetchMovieDetails, fetchCollectionDetails } from "../../services/tmdb";
import { formatDate, formatCurrency } from "../../utils/helpers";

const MovieDetails = () => {
	// ~~~ Hardcoded Movie ID for Testing (Replace with useParams() for Dynamic IDs) ~~~
	const movieId = "671";

	// ~~~ State Variables ~~~
	const [movie, setMovie] = useState(null);
	const [cast, setCast] = useState([]);
	const [director, setDirector] = useState(null);
	const [trailer, setTrailer] = useState(null);
	const [collection, setCollection] = useState(null);
	const [visibleActors, setVisibleActors] = useState(10);
	const [viewportWidth, setViewportWidth] = useState(document.documentElement.clientWidth);
	const [columns, setColumns] = useState(2); // Default to 2 columns

	// ~~~ Handle Window Resizing (Adjusted to Reduce Width by 10%) ~~~
	useEffect(() => {
		const handleResize = () => {
			const adjustedWidth = document.documentElement.clientWidth * 0.5; // Reduce width of viewport
			setViewportWidth(adjustedWidth);
			console.log("Updated Adjusted Viewport Width:", adjustedWidth);
			updateColumns(); // Recalculate grid layout on resize
		};

		window.addEventListener("resize", handleResize);

		// Initial calculation on component mount
		const initialAdjustedWidth = document.documentElement.clientWidth * 0.9;
		setViewportWidth(initialAdjustedWidth);
		console.log("Initial Adjusted Viewport Width:", initialAdjustedWidth);

		return () => window.removeEventListener("resize", handleResize);
	}, []);


	// ~~~ Dynamically Adjust Number of Columns Based on Available Space ~~~
	const updateColumns = () => {
		const cardWidth = 320; // Approximate width of an ActorCard including padding
		const sidePadding = 40; // Space on left and right
		const gapBetweenCards = 20; // Space between actor cards

		// Calculate the available width while ensuring there is proper spacing
		const availableWidth = viewportWidth - sidePadding * 2;
		const maxColumns = Math.floor((availableWidth + gapBetweenCards) / (cardWidth + gapBetweenCards));

		setColumns(Math.max(1, maxColumns)); // Ensure at least 1 column
	};

	// ~~~ Fetch Movie Data from API ~~~
	useEffect(() => {
		const loadMovieData = async () => {
			try {
				const movieData = await fetchMovieDetails(movieId);
				if (!movieData) return;

				setMovie(movieData);

				// ~~~ Extract Cast Data ~~~
				if (movieData.credits?.cast?.length > 0) {
					setCast(movieData.credits.cast);
				}

				// ~~~ Extract Director Data ~~~
				if (movieData.credits?.crew?.length > 0) {
					const movieDirector = movieData.credits.crew.find(member => member.job === "Director");
					setDirector(movieDirector || null);
				}

				// ~~~ Extract Trailer (YouTube) ~~~
				if (movieData.videos?.results?.length > 0) {
					const movieTrailer = movieData.videos.results.find(video => video.type === "Trailer" && video.site === "YouTube");
					setTrailer(movieTrailer || null);
				}

				// ~~~ Fetch Movie Collection (If Applicable) ~~~
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

	// ~~~ Display Loading State if Movie Data is Not Available ~~~
	if (!movie) return <p>Loading movie details...</p>;

	// ~~~ Function to Load More Actors ~~~
	const loadMoreActors = () => {
		setVisibleActors((prev) => Math.min(prev + 10, cast.length));
	};

	return (
		<>
			{/* ~~~ Navbar at the Top ~~~ */}
			<Navbar />

			{/* ~~~ Movie Details Page Container (inc. Poster, Title, Cast, etc.) ~~~ */}
			<div className="movie-details-page" style={{ paddingTop: "100px" }}>
				<div className="movie-header">

					{/* ~~~ Movie Poster ~~~ */}
					<img
						className="movie-poster"
						src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
						alt={movie.title}
					/>

					{/* ~~~ Movie Title + Release Year ~~~ */}
					<div className="movie-content">
						<h1 className="title is-2 has-text-weight-bold modern-title">
							{movie.title}
							<span className="release-year" style={{ fontWeight: "normal" }}>
								({formatDate(movie.release_date, "YYYY")})
							</span>
						</h1>

						{/* ~~~ Progress Bar for Rating ~~~ */}
						<div className="rating-container">
							<span className="rating-text">{Math.round(movie.vote_average * 10)}%</span>
							<progress
								className="progress is-success rating-bar"
								value={movie.vote_average * 10}
								max="100">
							</progress>
						</div>

						{/* ~~~ Actor/Cast Section ~~~ */}
						<div className="actor-list-container">
							<div className="actor-list" style={{
								display: "flex",
								flexWrap: "wrap",
								gap: "20px",
								justifyContent: "flex-start",
							}}>
								{cast.slice(0, visibleActors).map((actor) => (
									<ActorCard key={actor.id} actor={actor} movieReleaseDate={movie.release_date} />
								))}
							</div>
						</div>
						{/* ~~~ Show More Button (For Additional Actors) ~~~ */}
						{visibleActors < cast.length && (
							<button className="show-more-actors" onClick={loadMoreActors}>
								Show more actors...
							</button>
						)}
					</div>
				</div>

				{/* ~~~ Movie Information ~~~ */}
				<p><strong>Duration:</strong> {movie.runtime} min</p>
				<p><strong>Budget:</strong> {formatCurrency(movie.budget)}</p>
				<p><strong>Box Office Revenue:</strong> {formatCurrency(movie.revenue)}</p>
				<p><strong>Genres:</strong> {movie.genres.map(genre => genre.name).join(", ")}</p>
				<p><strong>Description:</strong> {movie.overview}</p>

				{/* ~~~ Display Director (If Available) ~~~ */}
				{director && <p><strong>Director:</strong> {director.name}</p>}

				{/* ~~~ Trailer Link (If Available) ~~~ */}
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

				{/* ~~~ Other Movies in the Collection (If Available) ~~~ */}
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
