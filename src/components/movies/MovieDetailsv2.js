// src/components/movies/MovieDetailsv2.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchMovieDetails, fetchPersonDetails, fetchCollectionDetails } from "../../services/tmdb";
import { formatDate, calculateAge, formatCurrency } from "../../utils/helpers";

// ############### MOVIE INFO ###############
const MovieDetailsv2 = () => {
  // For testing, movieId is hardcoded; later you can use useParams() to fetch dynamic IDs
  const movieId = "671";

  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [director, setDirector] = useState(null);
  const [trailer, setTrailer] = useState(null);
  const [collection, setCollection] = useState(null);

  useEffect(() => {
    const loadMovieData = async () => {
      try {
        const movieData = await fetchMovieDetails(movieId);
        if (!movieData) return;

        setMovie(movieData);

        if (movieData.credits?.cast?.length > 0) {
          setCast(movieData.credits.cast.slice(0, 10)); // Top 10 cast members
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
    <div>
      <h1>{movie.title}</h1>
      <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title} />
      <p><strong>Release Year:</strong> {formatDate(movie.release_date, "YYYY")}</p>
      <p><strong>Rating:</strong> {movie.vote_average} / 10</p>
      <p><strong>Duration:</strong> {movie.runtime} min</p>
      <p><strong>Budget:</strong> {formatCurrency(movie.budget)}</p>
      <p><strong>Box Office Revenue:</strong> {formatCurrency(movie.revenue)}</p>
      <p><strong>Genres:</strong> {movie.genres.map(genre => genre.name).join(", ")}</p>
      <p><strong>Description:</strong> {movie.overview}</p>

      {director && <p><strong>Director:</strong> {director.name}</p>}

      {trailer && (
        <div>
          <h2>Trailer</h2>
          <iframe
            width="560"
            height="315"
            src={`https://www.youtube.com/embed/${trailer.key}`}
            title="Movie Trailer"
            frameBorder="0"
            allowFullScreen
          ></iframe>
        </div>
      )}

      <h2>Cast</h2>
      <ul>
        {cast.length > 0 ? cast.map(actor => (
          <CastMember key={actor.id} actor={actor} movieReleaseDate={movie.release_date} />
        )) : <p>No cast information available.</p>}
      </ul>

      {collection && (
        <div>
          <h2>Other Movies in This Series</h2>
          <ul>
            {collection.parts.map(part => (
              <li key={part.id}>{part.title} ({part.release_date})</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ############### CAST INFO ###############
const CastMember = ({ actor, movieReleaseDate }) => {
  const [actorDetails, setActorDetails] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchActorData = async () => {
      try {
        const data = await fetchPersonDetails(actor.id);

        let nationality = "Unknown";
        if (data.place_of_birth) {
          const placeParts = data.place_of_birth.split(", ");
          nationality = placeParts.length > 1 ? placeParts[placeParts.length - 1] : data.place_of_birth;
        }

        const actorImages = data.images?.profiles?.map(img => img.file_path) || [];
        setActorDetails({ ...data, nationality, images: actorImages });
      } catch (error) {
        console.error("Error fetching actor details:", error);
      }
    };

    fetchActorData();
  }, [actor.id]);

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) =>
      actorDetails?.images?.length > 0 ? (prevIndex + 1) % actorDetails.images.length : 0
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      actorDetails?.images?.length > 0 ? (prevIndex - 1 + actorDetails.images.length) % actorDetails.images.length : 0
    );
  };

  return (
    <li>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          onClick={prevImage}
          disabled={!actorDetails?.images?.length}
          style={{ cursor: actorDetails?.images?.length ? "pointer" : "default" }}
        >
          &lt;
        </button>

        {actorDetails?.images?.length > 0 ? (
          <img
            src={`https://image.tmdb.org/t/p/w185${actorDetails.images[currentImageIndex]}`}
            alt={`${actor.name} - Image ${currentImageIndex + 1}`}
            style={{ width: "200px", height: "300px", objectFit: "cover" }}
          />
        ) : (
          <img
            src="https://via.placeholder.com/185"
            alt={actor.name}
            style={{ width: "200px", height: "300px", objectFit: "cover" }}
          />
        )}

        <button
          onClick={nextImage}
          disabled={!actorDetails?.images?.length}
          style={{ cursor: actorDetails?.images?.length ? "pointer" : "default" }}
        >
          &gt;
        </button>
      </div>

      <p>
        <strong>Name:</strong>{" "}
        <Link to={`/actor/${actor.id}`}>{actor.name}</Link>
      </p>
      <p><strong>Character:</strong> {actor.character}</p>
      {actorDetails && (
        <>
          <p><strong>Age Today:</strong> {calculateAge(actorDetails.birthday, new Date().toISOString().split("T")[0])}</p>
          <p><strong>Age at Release:</strong> {calculateAge(actorDetails.birthday, movieReleaseDate)}</p>
          <p><strong>Nationality:</strong> {actorDetails.nationality || "Unknown"}</p>
          <ActorRoles actorId={actor.id} actorDetails={actorDetails} />
        </>
      )}
    </li>
  );
};

// ############### ACTOR ROLES INFO ###############
const ActorRoles = ({ actorId, actorDetails }) => {
  const movieId = "671"; // Hardcoded for testing

  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const data = await fetchPersonDetails(actorId);
        if (data.movie_credits?.cast?.length > 0) {
          const currentMovieId = Number(movieId);
          const filteredRoles = data.movie_credits.cast.filter(movie => {
            return movie.release_date && movie.id !== currentMovieId;
          });
          const sortedRoles = filteredRoles
            .sort((a, b) => b.popularity - a.popularity)
            .slice(0, 5);
          setRoles(sortedRoles);
        }
      } catch (error) {
        console.error("Error fetching actor roles:", error);
      }
    };

    fetchRoles();
  }, [actorId, movieId]);

  return (
    <div>
      <h3>Other Popular Movies</h3>
      {roles.length === 0 ? (
        <p>No data available.</p>
      ) : (
        <ul>
          {roles.map(role => {
            const releaseYear = new Date(role.release_date).getFullYear();
            const ageAtRelease = actorDetails?.birthday ? calculateAge(actorDetails.birthday, role.release_date) : "Unknown";
            return (
              <li key={role.id}>
                <strong>{role.title}</strong> ({releaseYear}) - {role.vote_average.toFixed(1)}/10 - <em>{role.character || "Unknown Character"}</em>
                {ageAtRelease !== "Unknown" && ` (Age: ${ageAtRelease})`}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default MovieDetailsv2;
