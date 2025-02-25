// src/App.js

import React from "react";
import { Routes, Route } from "react-router-dom";
import MovieDetails from "./components/movies/MovieDetails";
import ActorDetails from "./components/actor/ActorDetails";
import ActorConnections from "./components/actor/ActorConnections";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MovieDetails />} />
      <Route path="/actor/:actorId" element={<ActorDetails />} />
      <Route path="/actor-connections/:actorId" element={<ActorConnections />} />
    </Routes>
  );
}

export default App;
