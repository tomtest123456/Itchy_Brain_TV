import React from "react";
import { Link } from "react-router-dom";
import { formatReleaseDate } from "../../utils/helpers";
import "../../assets/styles/MovieCard.css";

function MovieCard({ movie }) {
  return (
    <Link to={`/movie/${movie.id}`} className="movie-link">
      <div className="movie-card">
        {movie.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
            alt={movie.title}
            className="movie-image"
          />
        ) : (
          <div className="no-image">No Image</div>
        )}
        <h3 className="movie-title">{movie.title}</h3>
        <p className="movie-date">{formatReleaseDate(movie.release_date)}</p>
      </div>
    </Link>
  );
}

export default MovieCard;
