function MovieCard({ movie }) {
    return (
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
        <p>📅 {movie.release_date || "Unknown Release Date"}</p>
      </div>
    );
  }
  
  const cardStyle = {
    backgroundColor: "#1a1a1a",
    color: "#fff",
    borderRadius: "10px",
    padding: "10px",
    textAlign: "center",
    boxShadow: "0 4px 8px rgba(255, 255, 255, 0.2)",
    transition: "transform 0.2s",
    cursor: "pointer",
  };
  
  const imageStyle = {
    width: "100%",
    borderRadius: "8px",
  };
  
  const titleStyle = {
    fontSize: "16px",
    marginTop: "10px",
    color: "#00bcd4",
  };
  
  const noImageStyle = {
    width: "100%",
    height: "200px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#333",
    borderRadius: "8px",
    color: "#ccc",
  };
  
  export default MovieCard;
  