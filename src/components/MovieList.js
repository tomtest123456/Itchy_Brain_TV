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
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "20px",
  justifyContent: "center",
  padding: "20px",
};

export default MovieList;
