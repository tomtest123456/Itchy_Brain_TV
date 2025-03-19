// src/App.js

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import MovieDetails from './components/movies/MovieDetails';
import ActorDetails from './components/actor/ActorDetails';
import ActorConnections from './components/actor/ActorConnections';
import Navbar from './components/common/Navbar';

// Add custom styles for fixed navbar spacing
const navbarHeight = "90px"; // Adjust this value as needed
document.documentElement.style.setProperty('--navbar-height', navbarHeight);

function App() {
	return (
		<>
			<Navbar />
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/movie/:id" element={<MovieDetails />} />
				<Route path="/actor/:actorId" element={<ActorDetails />} />
				<Route path="/actor-connections/:actorId" element={<ActorConnections />} />
			</Routes>
		</>
	);
}

export default App;