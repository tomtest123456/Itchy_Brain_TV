// src/components/actors/ActorDetails.js
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchPersonDetails } from "../../services/tmdb";
import { formatDate, calculateAge } from "../../utils/helpers";

const ActorDetails = () => {
  const { actorId } = useParams();
  const [actor, setActor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadActorDetails = async () => {
      try {
        const data = await fetchPersonDetails(actorId);
        setActor(data);
      } catch (err) {
        setError("Failed to load actor details.");
      } finally {
        setLoading(false);
      }
    };

    loadActorDetails();
  }, [actorId]);

  if (loading) return <p>Loading actor details...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (!actor) return <p>No actor details available.</p>;

  let nationality = "Unknown";
  if (actor.place_of_birth) {
    const parts = actor.place_of_birth.split(", ");
    nationality = parts[parts.length - 1];
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>{actor.name}</h1>
      <img
        src={actor.profile_path ? `https://image.tmdb.org/t/p/w500${actor.profile_path}` : "https://via.placeholder.com/500x750?text=No+Image"}
        alt={actor.name}
        style={{ width: "300px", height: "auto" }}
      />
      <p>
        <strong>Birthday:</strong>{" "}
        {actor.birthday ? formatDate(actor.birthday, "dd Mon YYYY") : "Unknown"}
      </p>
      {actor.deathday && (
        <p>
          <strong>Died:</strong> {formatDate(actor.deathday, "dd Mon YYYY")}
        </p>
      )}
      <p>
        <strong>Age:</strong>{" "}
        {actor.birthday
          ? calculateAge(actor.birthday, new Date().toISOString().split("T")[0])
          : "Unknown"}
      </p>
      <p>
        <strong>Nationality:</strong> {nationality}
      </p>
      <h2>Biography</h2>
      <p>{actor.biography || "No biography available."}</p>
      <h2>Filmography</h2>
      {actor.movie_credits && actor.movie_credits.cast && actor.movie_credits.cast.length > 0 ? (
        <ul>
          {actor.movie_credits.cast
            .filter(movie => movie.release_date)
            .sort((a, b) => new Date(b.release_date) - new Date(a.release_date))
            .map(movie => (
              <li key={movie.id}>
                <strong>{movie.title}</strong>{" "}
                {movie.release_date ? `(${new Date(movie.release_date).getFullYear()})` : ""} - Role: {movie.character || "Unknown"}
              </li>
            ))}
        </ul>
      ) : (
        <p>No filmography available.</p>
      )}
    </div>
  );
};

export default ActorDetails;
