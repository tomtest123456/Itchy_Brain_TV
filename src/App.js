// src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import MovieDetailsv2 from "./components/movies/MovieDetailsv2";
import ActorDetails from "./components/actor/ActorDetails";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MovieDetailsv2 />} />
      <Route path="/actor/:actorId" element={<ActorDetails />} />
    </Routes>
  );
}

export default App;
