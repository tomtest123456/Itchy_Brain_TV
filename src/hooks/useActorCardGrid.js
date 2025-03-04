import { useState, useEffect } from 'react';

/**
 * Custom hook to calculate the optimal number of actor cards to display
 * based on the container width and desired number of cards
 * @param {Object} options Configuration options
 * @param {number} options.desiredTotal Desired total number of cards (default: 10)
 * @param {number} options.cardMinWidth Minimum width of each card in pixels (default: 200)
 * @param {string} options.containerSelector CSS selector for the container element
 * @returns {Object} Object containing the optimal number of cards and cards per row
 */
const useActorCardGrid = ({
    desiredTotal = 10,
    cardMinWidth = 200,
    containerSelector = '.cast-grid'
}) => {
    const [optimalCardCount, setOptimalCardCount] = useState(desiredTotal);
    const [cardsPerRow, setCardsPerRow] = useState(0);

    useEffect(() => {
        const calculateOptimalLayout = () => {
            const container = document.querySelector(containerSelector);
            if (!container) return;

            const containerWidth = container.offsetWidth;
            const maxCardsPerRow = Math.floor(containerWidth / cardMinWidth);

            // Calculate how many complete rows we can have
            const completeRows = Math.floor(desiredTotal / maxCardsPerRow);
            const remainingCards = desiredTotal % maxCardsPerRow;

            // If we have remaining cards and it's not a full row,
            // reduce the total to the nearest complete row
            const optimalTotal = remainingCards > 0
                ? completeRows * maxCardsPerRow
                : desiredTotal;

            setCardsPerRow(maxCardsPerRow);
            setOptimalCardCount(optimalTotal);
        };

        // Initial calculation
        calculateOptimalLayout();

        // Recalculate on window resize
        const debouncedResize = debounce(calculateOptimalLayout, 250);
        window.addEventListener('resize', debouncedResize);

        return () => {
            window.removeEventListener('resize', debouncedResize);
        };
    }, [desiredTotal, cardMinWidth, containerSelector]);

    return {
        optimalCardCount,
        cardsPerRow
    };
};

// Debounce helper function
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

export default useActorCardGrid; 