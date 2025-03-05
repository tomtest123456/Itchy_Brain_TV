import requests
import json
import os
from time import sleep
from config import API_KEY

# TMDB API configuration
BASE_URL = "https://api.themoviedb.org/3"

def get_collection_details(collection_id):
    """Fetch detailed information about a specific collection"""
    url = f"{BASE_URL}/collection/{collection_id}"
    response = requests.get(url, params={"api_key": API_KEY})
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error getting collection {collection_id}: {response.status_code}")
    return None

def search_collections(query):
    """Search for collections by name"""
    url = f"{BASE_URL}/search/collection"
    response = requests.get(url, params={
        "api_key": API_KEY,
        "query": query,
        "page": 1
    })
    if response.status_code == 200:
        return response.json()["results"]
    return []

def get_popular_collections():
    """Get popular collections using various methods"""
    collections = {}
    
    # List of popular franchises to search for
    popular_franchises = [
        "Star Wars", "Marvel", "Harry Potter", "James Bond", "Lord of the Rings",
        "Fast and Furious", "Batman", "Spider-Man", "X-Men", "Jurassic Park",
        "Mission: Impossible", "Terminator", "Alien", "Indiana Jones", "Matrix",
        "Transformers", "Pirates of the Caribbean", "Toy Story", "Ice Age", "Shrek",
        "The Hunger Games", "Twilight", "Avengers", "Iron Man", "Captain America",
        "Thor", "Guardians of the Galaxy", "Ant-Man", "Doctor Strange", "Black Panther",
        "Rocky", "Rambo", "Die Hard", "Bourne", "Ocean's", "Mad Max", "John Wick",
        "Planet of the Apes", "The Godfather", "Back to the Future", "Men in Black",
        "Ghostbusters", "Blade Runner", "Predator", "Halloween", "Friday the 13th",
        "Nightmare on Elm Street", "Final Destination", "Saw", "Resident Evil"
    ]
    
    # Search for each franchise
    for franchise in popular_franchises:
        print(f"Searching for {franchise} collections...")
        results = search_collections(franchise)
        for result in results:
            collection_id = result["id"]
            if collection_id not in collections:
                collection_details = get_collection_details(collection_id)
                if collection_details:
                    collections[collection_id] = collection_details
                    print(f"Found collection {len(collections)}/100: {collection_details['name']}")
                    if len(collections) >= 100:
                        return collections
                    sleep(0.25)  # Rate limiting
    
    # If we still need more collections, let's try some direct collection IDs
    known_collection_ids = [
        10, 84, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99,
        100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112,
        113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125
    ]
    
    for collection_id in known_collection_ids:
        if collection_id not in collections:
            collection_details = get_collection_details(collection_id)
            if collection_details:
                collections[collection_id] = collection_details
                print(f"Found collection {len(collections)}/100: {collection_details['name']}")
                if len(collections) >= 100:
                    return collections
                sleep(0.25)  # Rate limiting
    
    return collections

def update_collections_file():
    """Update the collections.json file with new collection data"""
    collections = get_popular_collections()
    
    # Read existing collections file or create new one
    collections_file_path = "../data/collections.json"
    try:
        with open(collections_file_path, 'r', encoding='utf-8') as f:
            try:
                existing_data = json.load(f)
            except json.JSONDecodeError:
                existing_data = {}
    except FileNotFoundError:
        existing_data = {}
    
    # Update with new collections
    for collection_id, collection_data in collections.items():
        existing_data[str(collection_id)] = {
            "id": collection_id,
            "name": collection_data["name"],
            "overview": collection_data["overview"],
            "poster_path": collection_data["poster_path"],
            "backdrop_path": collection_data["backdrop_path"],
            "parts": collection_data["parts"]
        }
    
    # Create data directory if it doesn't exist
    os.makedirs(os.path.dirname(collections_file_path), exist_ok=True)
    
    # Write back to file
    with open(collections_file_path, 'w', encoding='utf-8') as f:
        json.dump(existing_data, f, indent=2, ensure_ascii=False)
    
    print(f"Updated collections.json with {len(collections)} new collections")

if __name__ == "__main__":
    update_collections_file() 