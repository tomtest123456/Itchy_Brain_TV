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
        # Superhero/Comic Book
        "Marvel", "Avengers", "Iron Man", "Captain America", "Thor", 
        "Guardians of the Galaxy", "Ant-Man", "Doctor Strange", "Black Panther",
        "Batman", "Spider-Man", "X-Men", "Wonder Woman", "Thunderbolts",
        "Kraven the Hunter",

        # Sci-Fi/Fantasy
        "Star Wars", "Star Trek", "Avatar", "Dune", "Matrix", "Tron",
        "The Wizarding World", "Harry Potter", "Lord of the Rings", "The Hobbit",
        "The Chronicles of Narnia", "Transformers", "RoboCop", "Unbreakable",
        "The Electric State",

        # Action/Adventure
        "James Bond", "Fast and Furious", "Mission: Impossible", "Indiana Jones",
        "John Wick", "Die Hard", "Bourne", "Ocean's", "Mad Max", "National Treasure",
        "The Equalizer", "Taken", "Speed", "Top Gun", "Karate Kid", "The Old Guard",
        "The Accountant",

        # Horror/Thriller
        "Alien", "Predator", "Halloween", "Friday the 13th", "Saw", "Resident Evil",
        "The Conjuring Universe", "Nightmare on Elm Street", "Final Destination",
        "The Evil Dead", "The Exorcist", "The Texas Chainsaw Massacre", "Scream",
        "The Strangers", "M3GAN", "The Black Phone", "28 Days Later",

        # Animation
        "Toy Story", "Ice Age", "Shrek", "Cars", "The Incredibles", "The Lego Movie",
        "How to Train Your Dragon", "The Secret Life of Pets", "Finding Nemo",
        "Monsters Inc", "Hotel Transylvania", "SpongeBob SquarePants", "Trolls",
        "Wallace & Gromit", "Wreck-It Ralph", "Frozen", "Encanto", "Zootopia",
        "The Bad Guys", "Lilo & Stitch", "The Smurfs",

        # Action/Comedy
        "Pirates of the Caribbean", "Men in Black", "Ghostbusters", "Rush Hour",
        "Police Academy", "Red", "Sonic the Hedgehog", "Teenage Mutant Ninja Turtles",
        "Zombieland", "Zoolander", "Happy Gilmore", "A Simple Favor",

        # Drama/Crime
        "Rocky", "Rambo", "Planet of the Apes", "The Godfather", "Back to the Future",
        "Blade Runner", "Sherlock Holmes", "Jumanji", "Paddington", "Pitch Perfect",
        "Joker", "Five Nights at Freddy's", "Beetlejuice", "Freaky Friday",
        "The Pink Panther", "The Addams Family", "Mortal Kombat", "Greenland",
        "Wicked"
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
                    print(f"Found collection {len(collections)}/200: {collection_details['name']}")
                    if len(collections) >= 200:  # Increased limit to accommodate more collections
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