import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
	return (
		<nav className="custom-navbar">
			<div className="nav-content">
				{/* Left - Logo */}
				<div className="nav-logo">Itchy Brain</div>

				{/* Center - Links */}
				<ul className="nav-links">
					<Link to="/movies">Movies</Link>
					<Link to="/movies">TV Shows</Link>
					<Link to="/movies">Actors</Link>
					<Link to="/movies">Others 1</Link>
					<Link to="/movies">Others 2</Link>
					<Link to="/movies">Others 3</Link>
				</ul>

				{/* Right - Investors Button */}
				<div className="nav-button">
					<a href="#" className="investors-button">Investors</a>
				</div>
			</div>
		</nav>
	);
};

export default Navbar;
