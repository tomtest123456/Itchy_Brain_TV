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
					<li><a href="#">Movies</a></li>
					<li><a href="#">TV Shows</a></li>
					<li><a href="#">Actors</a></li>
					<li><a href="#">Other 1</a></li>
					<li><a href="#">Other 2</a></li>
					<li><a href="#">Other 3</a></li>
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
