import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const MovieDetails = () => {
  const { id } = useParams(); // Get the movie ID from the URL
  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]); // Store cast members
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        // Fetch movie details
        const movieResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.REACT_APP_TMDB_API_KEY}&language=en-US`
        );
        if (!movieResponse.ok) throw new Error("Failed to fetch movie details");
        const movieData = await movieResponse.json();
        setMovie(movieData);

        // Fetch movie cast
        const castResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${id}/credits?api_key=${process.env.REACT_APP_TMDB_API_KEY}&language=en-US`
        );
        if (!castResponse.ok) throw new Error("Failed to fetch cast details");
        const castData = await castResponse.json();
        setCast(castData.cast.slice(0, 10)); // Limit to top 10 cast members
      } catch (error) {
        setError(error.message);
      }
    };

    fetchMovieDetails();
  }, [id]);

  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (!movie) return <p>Loading...</p>;

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>{movie.title}</h1>
      {movie.poster_path ? (
        <img
          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
          alt={movie.title}
          style={imageStyle}
        />
      ) : (
        <div style={noImageStyle}>No Image</div>
      )}
      <p>
        <span role="img" aria-label="calendar">📅</span> {movie.release_date || "Unknown Release Date"}
      </p>
      <p><strong>Overview:</strong> {movie.overview || "No overview available."}</p>
      <p>
        <strong>Rating:</strong>
        <span role="img" aria-label="star">⭐</span> {movie.vote_average}/10
      </p>

      {/* Display Cast Section */}
      <h2 style={subtitleStyle}>Cast</h2>
      <div style={castContainerStyle}>
        {cast.length > 0 ? (
          cast.map((actor) => (
            <div key={actor.id} style={castCardStyle}>
              {actor.profile_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                  alt={actor.name}
                  style={castImageStyle}
                />
              ) : (
                <div style={noImageStyle}>No Image</div>
              )}
              <p style={castNameStyle}>{actor.name}</p>
              <p style={castCharacterStyle}>as {actor.character}</p>
            </div>
          ))
        ) : (
          <p>No cast information available.</p>
        )}
      </div>
    </div>
  );
};

// Styles
const containerStyle = {
  padding: "20px",
  color: "#fff",
  backgroundColor: "#1a1a1a",
  minHeight: "100vh",
  textAlign: "center",
};

const titleStyle = {
  color: "#00bcd4",
};

const subtitleStyle = {
  marginTop: "20px",
  color: "#ffcc00",
};

const imageStyle = {
  width: "300px",
  borderRadius: "10px",
  marginBottom: "20px",
};

const noImageStyle = {
  width: "300px",
  height: "450px",
  backgroundColor: "#333",
  color: "#ccc",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "10px",
};

const castContainerStyle = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "15px",
  marginTop: "10px",
};

const castCardStyle = {
  width: "150px",
  textAlign: "center",
  backgroundColor: "#222",
  padding: "10px",
  borderRadius: "10px",
};

const castImageStyle = {
  width: "100%",
  borderRadius: "8px",
};

const castNameStyle = {
  fontWeight: "bold",
  marginTop: "5px",
};

const castCharacterStyle = {
  fontSize: "14px",
  color: "#ccc",
};

export default MovieDetails;
