import React from 'react';
import SearchBar from '../components/search/SearchBar';
import './Home.css';

const Home = () => {
    return (
        <div className="home-container">
            <div className="home-search">
                <h1 className="home-title">Movies n Shit</h1>
                <SearchBar isLarge={true} />
            </div>
        </div>
    );
};

export default Home; 