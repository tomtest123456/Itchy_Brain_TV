// ========================================
// ActorDetails.js
// This component displays detailed information about an actor
// including their biography, filmography, and personal details.
// ========================================

import React from 'react';
import { useParams } from 'react-router-dom';

const ActorDetails = () => {
    const { actorId } = useParams();

    return (
        <div className="actor-details-container">
            <h1>Actor Details</h1>
            <p>Actor ID: {actorId}</p>
        </div>
    );
};

export default ActorDetails;
