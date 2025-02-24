import React from "react";

import MovieCard from "./MovieCard";

function MovieList({ movies }) {
  return (
    <div style={gridContainerStyle}>
      {movies.length > 0 ? (
        movies.map((movie) => <MovieCard key={movie.id} movie={movie} />)
      ) : (
        <p>Type a movie name and press Search.</p>
      )}
    </div>
  );
}

const gridContainerStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", // Dynamic columns
  gap: "16px",
  justifyContent: "center",
  padding: "16px",
};

export default MovieList;
