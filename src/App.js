// src/App.js

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import MovieDetails from './components/movies/MovieDetails';
import TVSeriesDetails from './components/tvseries/TVSeriesDetails';
import ActorDetails from './components/actor/ActorDetails';
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
                <Route path="/tv/:id" element={<TVSeriesDetails />} />
                <Route path="/actor/:id" element={<ActorDetails />} />
			</Routes>
		</>
	);
}

export default App;