import { useEffect, useState } from "react";

function App() {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovie = async () => {
      const apiKey = process.env.REACT_APP_TMDB_API_KEY;

      if (!apiKey) {
        setError("API key is missing!");
        setLoading(false);
        return;
      }

      const url = `https://api.themoviedb.org/3/movie/550?api_key=${apiKey}`;

      try {
        setLoading(true);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);
        const data = await response.json();
        setMovie(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, []);

  return (
    <div>
      <h1>TMDB API Test</h1>

      {loading ? (
        <p>Loading...</p> // Placeholder for a spinner (we can replace it later)
      ) : error ? (
        <p style={{ color: "red" }}>Error: {error}</p>
      ) : movie ? (
        <div>
          <h2 style={{ color: "darkblue", textDecoration: "underline" }}>
            {movie.title}
          </h2>
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={movie.title}
            style={{ width: "300px", borderRadius: "10px" }}
          />
          <p>{movie.overview}</p>
          <p>Release Date: {movie.release_date}</p>
        </div>
      ) : null}
    </div>
  );
}

export default App;
