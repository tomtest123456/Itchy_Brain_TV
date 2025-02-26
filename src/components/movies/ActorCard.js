import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchPersonDetails } from "../../services/tmdb";
import { formatDate, calculateAge } from "../../utils/helpers";
import "./ActorCard.css";


const ActorCard = ({ actor, movieReleaseDate }) => {
    const [actorDetails, setActorDetails] = useState(null);

    useEffect(() => {
        const fetchActorData = async () => {
            if (!actor.id) return;

            try {
                const data = await fetchPersonDetails(actor.id);
                if (!data) return;

                setActorDetails(data);
            } catch (error) {
                console.error("Error fetching actor details:", error);
            }
        };

        fetchActorData();
    }, [actor.id]);

    if (!actorDetails) return null; // Prevents crashes

    return (
        <div className="actor-card-container">
            <div className="actor-card">
                {/* Actor Profile Picture */}
                <img
                    className="actor-image"
                    src={actorDetails.profile_path
                        ? `https://image.tmdb.org/t/p/w185${actorDetails.profile_path}`
                        : "https://dummyimage.com/185x278/aaa/fff.png&text=No+Image"}
                    alt={actor.name}
                />

                {/* Actor Information */}
                <div className="actor-info">
                    <h3 className="actor-name">
                        <Link to={`/actor/${actor.id}`}>
                            {actor.name} (Age: {calculateAge(actorDetails.birthday, new Date().toISOString().split("T")[0])})
                        </Link>
                    </h3>

                    <p className="actor-character">
                        {actor.character} (Aged: {calculateAge(actorDetails.birthday, movieReleaseDate)})
                    </p>

                    <hr className="actor-divider" />

                    {/* Display Other Movies */}
                    <ul className="actor-movies">
                        {actorDetails.movie_credits?.cast?.slice(0, 3).map((movie) => (
                            <li key={movie.id} className="actor-movie-item">
                                <div className="actor-movie-title">
                                    <strong>{movie.title}</strong> <span>({formatDate(movie.release_date, "YYYY")})</span>
                                </div>
                                <div className="actor-movie-subtext">
                                    <span>as {movie.character} (Aged: {calculateAge(actorDetails.birthday, movie.release_date)})</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ActorCard;
