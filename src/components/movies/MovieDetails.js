import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../../assets/styles/MovieDetails.css";

function MovieDetails() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleActors, setVisibleActors] = useState(10); // Show first 10 actors

  const apiKey = process.env.REACT_APP_TMDB_API_KEY;

  useEffect(() => {
    if (!apiKey) {
      console.error("API Key is missing! Check your .env file.");
      setError("API Key is missing. Check your setup.");
      setLoading(false);
      return;
    }

    const fetchMovieDetails = async () => {
      try {
        const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&append_to_response=credits,videos`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch movie details: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setMovie(data);
      } catch (error) {
        console.error("Error fetching movie details:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [id, apiKey]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!movie) return <p>No movie found.</p>;

  const director = movie.credits?.crew?.find((member) => member.job === "Director");
  const trailer = movie.videos?.results.find((video) => video.type === "Trailer")?.key || null;

  return (
    <div id="movie-details-page">
      <div className="movie-placeholder">PLACEHOLDER FOR FUTURE ADDITION</div>

      {/* Movie Header */}
      <div className="movie-header">
        <img
          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
          alt={movie.title}
          className="movie-poster"
        />

        <div className="movie-info">
          <h1 className="movie-title">{movie.title} ({new Date(movie.release_date).getFullYear()})</h1>

          {/* Cast Section - Positioned Next to Poster */}
          <div className="cast-container">
            {movie.credits?.cast?.slice(0, visibleActors).map((actor) => (
              <div key={actor.id} className="cast-card">
                <img
                  src={actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : "https://via.placeholder.com/80"}
                  alt={actor.name}
                />
                <div className="cast-details">
                  <p className="cast-name">{actor.name}</p>
                  <p className="cast-character">{actor.character}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Show More Button */}
          {visibleActors < movie.credits?.cast?.length && (
            <button className="show-more-button" onClick={() => setVisibleActors(visibleActors + 10)}>
              Show More
            </button>
          )}
        </div>
      </div>

      {/* Bio Box Below Poster */}
      <div className="movie-meta-container">
        <p className="movie-meta">
          {new Date(movie.release_date).toLocaleDateString()} • {movie.genres.map((genre) => genre.name).join(", ")} • {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
        </p>
        {trailer && (
          <a href={`https://www.youtube.com/watch?v=${trailer}`} target="_blank" rel="noopener noreferrer" className="play-trailer">
            ▶ Play Trailer
          </a>
        )}
        <p className="movie-overview">{movie.overview}</p>
        {director && <p className="director">Directed by: {director.name}</p>}
      </div>
    </div>
  );
}

export default MovieDetails;
