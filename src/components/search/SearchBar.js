import React from "react";

import { useState } from "react";

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() !== "") {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ textAlign: "center", marginBottom: "20px" }}>
      <input
        type="text"
        placeholder="Search for a movie..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ padding: "10px", fontSize: "16px", width: "300px" }}
      />
      <button type="submit" style={{ padding: "10px", marginLeft: "10px", cursor: "pointer" }}>
        Search
      </button>
    </form>
  );
}

export default SearchBar;
