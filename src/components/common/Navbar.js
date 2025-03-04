// ========================================
// Navbar.js
// This component provides the main navigation bar for the application,
// featuring a logo, navigation links, a search bar, and a user placeholder.
// It is fully responsive using Bulma and follows best practices for UI design.
// ========================================

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../search/SearchBar";

/**
* Navbar Component
* Displays the main navigation bar with a logo, navigation links, 
* a perfectly centered search bar, and a user placeholder.
* Fully responsive with Bulma's best practices.
*/
const Navbar = () => {
    // ========================================
    // State Management
    // ========================================

    const [isActive, setIsActive] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    // Function to toggle mobile menu
    const toggleMenu = () => {
        setIsActive(!isActive);
    };

    // Update window width on resize
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Dynamic Navigation Links (Easy to add more)
    const navLinks = [
        { name: "Movies", path: "/movies" },
        { name: "TV Shows", path: "/tv-shows" },
        { name: "Actors", path: "/actors" }
    ];

    // ========================================
    // Component Render
    // ========================================

    return (
        <>
            {/* Navbar */}
            <nav className="navbar is-fixed-top" style={styles.navbar}>
                <div className="container is-flex is-align-items-center" style={styles.navbarContainer}>

                    {/* Logo (Left) */}
                    <div className="navbar-brand">
                        <Link to="/" className="navbar-item" style={styles.logo}>
                            Itchy Brain
                        </Link>

                        {/* Mobile Burger Menu */}
                        <a
                            role="button"
                            className={`navbar-burger ${isActive ? "is-active" : ""}`}
                            aria-label="menu"
                            aria-expanded={isActive ? "true" : "false"}
                            onClick={toggleMenu}
                            style={styles.burger}
                        >
                            <span aria-hidden="true"></span>
                            <span aria-hidden="true"></span>
                            <span aria-hidden="true"></span>
                        </a>
                    </div>

                    {/* Search Bar (Perfectly Centered) */}
                    <div className="navbar-center" style={styles.navbarCenter}>
                        <SearchBar />
                    </div>

                    {/* Navbar Menu (Navigation Links & User Icon) */}
                    <div className={`navbar-menu ${isActive ? "is-active" : ""}`}>
                        <div className="navbar-end" style={styles.navbarEnd}>
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className="navbar-item"
                                    style={styles.navLink}
                                >
                                    {link.name}
                                </Link>
                            ))}

                            {/* User Placeholder (Yellow Circle) */}
                            <div className="navbar-item">
                                <div style={styles.userPlaceholder}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Add padding below Navbar to prevent content from getting too close */}
            <div style={styles.navbarPadding}></div>
        </>
    );
};

// ========================================
// Inline Styles for Navbar
// ========================================

const styles = {
    navbar: {
        height: "65px",
        backgroundColor: "rgb(27, 29, 31)",
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)", // Subtle Shadow
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        zIndex: 1000 // Ensure navbar is above search results
    },
    navbarContainer: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
    },
    logo: {
        fontSize: "1.6rem",
        fontWeight: "bold",
        color: " #FFFFFF"
    },
    burger: {
        color: " #FFFFFF"
    },
    navbarCenter: {
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
        width: "40%",
        display: "flex",
        justifyContent: "center"
    },
    navbarEnd: {
        display: "flex",
        alignItems: "center",
        gap: "30px", // Spread out links
    },
    navLink: {
        color: "rgb(255, 255, 255)",
        fontSize: "1rem",
        fontWeight: "500",
        transition: "font-weight 0.2s ease-in-out",
        textDecoration: "none"
    },
    navLinkHover: {
        fontWeight: "700"
    },
    userPlaceholder: {
        width: "35px",
        height: "35px",
        backgroundColor: "blue",
        borderRadius: "50%"
    },
    navbarPadding: {
        paddingTop: "1px"  // Prevents content from being too close to navbar
    }
};

export default Navbar;
