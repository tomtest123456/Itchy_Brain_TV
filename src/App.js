// src/App.js


import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/common/Navbar";
import MovieDetails from "./components/movies/MovieDetails";
import ActorDetails from "./components/actor/ActorDetails";
import ActorConnections from "./components/actor/ActorConnections";

// Add custom styles for fixed navbar spacing
const navbarHeight = "90px"; // Adjust this value as needed
document.documentElement.style.setProperty('--navbar-height', navbarHeight);

function App() {
	return (
		<>
			<Navbar /> {/* Add Navbar at the top */}
			<Routes>
				<Route path="/" element={<MovieDetails />} />
				<Route path="/actor/:actorId" element={<ActorDetails />} />
				<Route path="/actor-connections/:actorId" element={<ActorConnections />} />
				<Route path="/movies/:movieId" element={<MovieDetails />} />
			</Routes>
		</>
	);
}

export default App;