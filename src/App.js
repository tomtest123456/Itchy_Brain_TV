import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SearchBar from "./components/search/SearchBar";
import MovieList from "./components/movies/MovieList";
import MovieDetails from "./components/movies/MovieDetails";

function HomePage({ searchMovies, movies, loading, error }) {
  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Movie Search</h1>
      <SearchBar onSearch={searchMovies} />
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      <MovieList movies={movies} />
    </div>
  );
}

function App() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiKey = process.env.REACT_APP_TMDB_API_KEY;

  useEffect(() => {
    if (!apiKey) {
      console.error("API Key is missing! Please check your .env file.");
      setError("API Key is missing. Please check your setup.");
    }
  }, [apiKey]);

  const searchMovies = async (query) => {
    if (query.trim() === "") return;

    setLoading(true);
    setError(null);

    const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${query}`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);
      const data = await response.json();
      setMovies(data.results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage searchMovies={searchMovies} movies={movies} loading={loading} error={error} />} />
        <Route path="/movie/:id" element={<MovieDetails />} />
      </Routes>
    </Router>
  );
}

export default App;
