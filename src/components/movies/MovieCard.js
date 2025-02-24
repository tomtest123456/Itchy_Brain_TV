import React from "react";

import { Link } from "react-router-dom";
import { formatReleaseDate } from '../../utils/helpers';


function MovieCard({ movie }) {
  return (
    <Link to={`/movie/${movie.id}`} style={linkStyle}>
      <div style={cardStyle}>
        {movie.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
            alt={movie.title}
            style={imageStyle}
          />
        ) : (
          <div style={noImageStyle}>No Image</div>
        )}
        <h3 style={titleStyle}>{movie.title}</h3>
        <p>📅 {formatReleaseDate(movie.release_date)}</p>
      </div>
    </Link>
  );
}

const linkStyle = {
  textDecoration: "none",
  color: "inherit",
};

const cardStyle = {
  backgroundColor: "#1a1a1a",
  color: "#fff",
  borderRadius: "10px",
  padding: "10px",
  textAlign: "center",
  boxShadow: "0 4px 8px rgba(255, 255, 255, 0.2)",
  transition: "transform 0.2s",
  cursor: "pointer",
  maxWidth: "200px",
  height: "350px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  alignItems: "center",
};

const imageStyle = {
  width: "100%",
  height: "250px",
  objectFit: "cover",
  borderRadius: "8px",
};

const titleStyle = {
  fontSize: "14px",
  marginTop: "10px",
  color: "#00bcd4",
  textAlign: "center",
};

const noImageStyle = {
  width: "100%",
  height: "250px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#333",
  borderRadius: "8px",
  color: "#ccc",
  fontSize: "14px",
};

export default MovieCard;
