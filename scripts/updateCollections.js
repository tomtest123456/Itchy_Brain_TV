// ========================================
// updateCollections.js
// This script runs the weekly collection update
// ========================================

require('dotenv').config();
const { updateCollections } = require('../src/services/collectionManager');

const runUpdate = async () => {
    try {
        console.log('Starting collection update...');
        await updateCollections();
        console.log('Collection update completed successfully');
    } catch (error) {
        console.error('Error running collection update:', error);
        process.exit(1);
    }
};

runUpdate(); 