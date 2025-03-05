const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const API_KEY = 'afc1c6783b28f98ae9c9e714e3666efa';
const BASE_URL = "https://api.themoviedb.org/3";
const OUTPUT_DIR = path.join(__dirname, '../data');
const COLLECTIONS_FILE = path.join(OUTPUT_DIR, 'collections.json');

// List of collections to fetch with their expected names for validation
const COLLECTIONS_TO_FETCH = [
    { id: 1241, name: "Harry Potter Collection" },
    { id: 86311, name: "The Avengers Collection" },
    { id: 10, name: "Star Wars Collection" },
    { id: 119, name: "The Lord of the Rings Collection" }
];

// Ensure the data directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Load existing collections if any
const loadExistingCollections = () => {
    try {
        if (fs.existsSync(COLLECTIONS_FILE)) {
            const data = fs.readFileSync(COLLECTIONS_FILE, 'utf8');
            return new Map(Object.entries(JSON.parse(data)));
        }
    } catch (error) {
        console.error('Error loading existing collections:', error);
    }
    return new Map();
};

// Helper function to fetch from API
const fetchFromAPI = async (endpoint, params = "") => {
    try {
        const url = `${BASE_URL}${endpoint}?api_key=${API_KEY}${params}`;
        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Collection not found in TMDB database');
            }
            throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`TMDB API Error on ${endpoint}:`, error);
        return null;
    }
};

// Function to save collections to file
const saveCollections = (collections) => {
    try {
        const collectionsObject = Object.fromEntries(collections);
        fs.writeFileSync(COLLECTIONS_FILE, JSON.stringify(collectionsObject, null, 2));
        console.log(`Saved ${collections.size} collections to ${COLLECTIONS_FILE}`);
        return true;
    } catch (error) {
        console.error('Error saving collections:', error);
        return false;
    }
};

// Function to validate collection data
const validateCollection = (collection, expectedName) => {
    if (!collection) return false;
    if (!collection.name) return false;
    if (!collection.parts || !Array.isArray(collection.parts)) return false;
    if (collection.name !== expectedName) {
        console.error(`Collection name mismatch. Expected: ${expectedName}, Got: ${collection.name}`);
        return false;
    }
    return true;
};

// Function to fetch a collection
const fetchCollection = async (collectionInfo, collections) => {
    const { id, name } = collectionInfo;
    console.log(`\nFetching collection: ${name} (ID: ${id})...`);

    // Skip if we already have this collection
    if (collections.has(id.toString())) {
        console.log(`Collection ${name} already exists in cache`);
        const existingCollection = collections.get(id.toString());
        if (validateCollection(existingCollection, name)) {
            console.log(`Existing collection ${name} is valid`);
            return collections;
        } else {
            console.log(`Existing collection ${name} is invalid, will refetch`);
            collections.delete(id.toString());
        }
    }

    const details = await fetchFromAPI(`/collection/${id}`);
    if (details && validateCollection(details, name)) {
        collections.set(id.toString(), details);
        saveCollections(collections);
        console.log(`Successfully fetched and validated ${name}`);
        return collections;
    } else {
        console.error(`Failed to fetch or validate ${name}`);
        return collections;
    }
};

// Function to fetch all collections
const fetchAllCollections = async () => {
    let collections = loadExistingCollections();
    console.log(`Loaded ${collections.size} existing collections`);

    // Fetch each collection one by one
    for (const collectionInfo of COLLECTIONS_TO_FETCH) {
        collections = await fetchCollection(collectionInfo, collections);

        // Add a delay between collections
        if (collectionInfo !== COLLECTIONS_TO_FETCH[COLLECTIONS_TO_FETCH.length - 1]) {
            console.log('\nWaiting 2 seconds before next collection...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    // Final validation
    console.log('\nPerforming final validation...');
    let allValid = true;
    for (const collectionInfo of COLLECTIONS_TO_FETCH) {
        const collection = collections.get(collectionInfo.id.toString());
        if (!validateCollection(collection, collectionInfo.name)) {
            allValid = false;
            console.error(`Final validation failed for ${collectionInfo.name}`);
        }
    }

    if (allValid) {
        console.log('\nAll collections fetched and validated successfully!');
    } else {
        console.error('\nSome collections failed validation. Please check the errors above.');
    }

    return collections;
};

// Run the script
fetchAllCollections().catch(error => {
    console.error('Script error:', error);
    process.exit(1);
}); 