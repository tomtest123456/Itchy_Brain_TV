import React, { useEffect, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import axios from "axios";
import { useParams } from "react-router-dom";
import ActorMindmap from "./ActorMindmap";

const MOVIE_LIMIT = 50; // Reduced from 50 to 30 for better performance
const COSTAR_LIMIT = 20; // Limit the number of co-stars displayed
const TOP_BILLED_CAST_LIMIT = 10; // Only consider top 4 billed actors per movie
const MIN_SHARED_MOVIES = 2; // Co-stars must appear in at least 2 movies to be included

const ActorConnections = () => {
	const { actorId } = useParams();
	const [elements, setElements] = useState([]);
	const [loading, setLoading] = useState(true);
	const [actorName, setActorName] = useState("");
	const [coStarData, setCoStarData] = useState([]);

	useEffect(() => {
		const fetchActorConnections = async () => {
			try {
				const apiKey = process.env.REACT_APP_TMDB_API_KEY;

				console.log("🔍 Fetching data for Actor ID:", actorId);

				if (!actorId) {
					console.error("❌ Error: actorId is undefined. Cannot proceed.");
					setLoading(false);
					return;
				}

				// Fetch actor details
				const actorResponse = await axios.get(
					`https://api.themoviedb.org/3/person/${actorId}?api_key=${apiKey}`
				);
				console.log("✅ Actor Data:", actorResponse.data);
				setActorName(actorResponse.data.name);

				// Fetch actor's movie credits
				const creditsResponse = await axios.get(
					`https://api.themoviedb.org/3/person/${actorId}/movie_credits?api_key=${apiKey}`
				);
				console.log("✅ Full API Response for Movie Credits:", creditsResponse.data);

				if (!creditsResponse.data.cast || creditsResponse.data.cast.length === 0) {
					console.warn("⚠️ No movie credits found for this actor.");
					setLoading(false);
					return;
				}

				// Get movies, sorted by popularity
				const movies = creditsResponse.data.cast
					.sort((a, b) => b.popularity - a.popularity)
					.slice(0, MOVIE_LIMIT);

				console.log(`🎬 Processing ${movies.length} movies (MOVIE_LIMIT: ${MOVIE_LIMIT})`);

				// Fetch all movie credits in parallel using Promise.all()
				const movieCreditRequests = movies.map(movie =>
					axios.get(`https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${apiKey}`)
				);
				const movieCreditsResponses = await Promise.all(movieCreditRequests);

				// Store co-star occurrences
				const coStarCount = {};
				const coStarMovies = {};

				movieCreditsResponses.forEach((response, index) => {
					const fullCast = response.data.cast || [];
					const movieTitle = movies[index].title;

					fullCast.slice(0, TOP_BILLED_CAST_LIMIT).forEach((coStar) => {
						if (!coStar || !coStar.id || coStar.id === Number(actorId)) return;

						if (!coStarCount[coStar.id]) {
							coStarCount[coStar.id] = 0;
							coStarMovies[coStar.id] = [];
						}

						coStarCount[coStar.id] += 1;
						coStarMovies[coStar.id].push(movieTitle);
					});
				});

				console.log("👥 Co-Star Counts:", coStarCount);
				console.log("🎭 Co-Star Movies:", coStarMovies);

				// Sort co-stars by most frequent appearances and limit to COSTAR_LIMIT
				const sortedCoStars = Object.entries(coStarCount)
					.filter(([coStarId, count]) => count >= MIN_SHARED_MOVIES) // Exclude co-stars appearing in only 1 movie
					.sort((a, b) => b[1] - a[1])
					.slice(0, COSTAR_LIMIT);

				console.log(`🏆 Final Co-Star List (Top ${COSTAR_LIMIT}):`, sortedCoStars);

				// Create Cytoscape elements and table data
				const nodes = [{ data: { id: String(actorId), label: actorResponse.data.name } }];
				const edges = [];
				const coStarDetails = sortedCoStars.map(([coStarId, count]) => {
                    const coStarName = movieCreditsResponses
                        .flatMap((response) => response.data.cast || [])
                        .find((coStar) => coStar.id === Number(coStarId))?.name || `Unknown Actor (${coStarId})`;
                
                    return {
                        id: coStarId,
                        name: coStarName, // ✅ Retrieves the correct co-star name
                        movieCount: count,
                        movies: coStarMovies[coStarId] || [],
                    };
                });
                
               
				coStarDetails.forEach((coStar) => {
					nodes.push({ data: { id: String(coStar.id), label: coStar.name } });
					edges.push({
						data: {
							source: String(actorId),
							target: String(coStar.id),
							label: `${coStar.movieCount} movies: ${coStar.movies.join(", ")}`,
						},
					});
				});

				setCoStarData(coStarDetails);
				setElements([...nodes, ...edges]);
				setLoading(false);
			} catch (error) {
				console.error("❌ Error fetching actor connections:", error);
				setLoading(false);
			}
		};

		fetchActorConnections();
	}, [actorId]);

	return (
		<div className="flex flex-col items-center">
			<h2 className="text-2xl font-bold mb-4">
				{loading ? "Loading..." : `Connections for ${actorName}`}
			</h2>
			{!loading && <ActorMindmap elements={elements} />}

			{/* Table Below the Mindmap */}
			{!loading && coStarData.length > 0 && (
				<div className="mt-8 w-3/4">
					<h3 className="text-xl font-bold mb-4">Co-Stars</h3>
					<table className="w-full border-collapse border border-gray-300">
						<thead>
							<tr className="bg-gray-200">
								<th className="border border-gray-300 p-2">Actor ID</th>
								<th className="border border-gray-300 p-2">Actor Name</th>
								<th className="border border-gray-300 p-2">Movies Together</th>
								<th className="border border-gray-300 p-2">Movie Titles</th> {/* ✅ Shows movie names */}
							</tr>
						</thead>
						<tbody>
							{coStarData.map((coStar) => (
								<tr key={coStar.id} className="text-center">
									<td className="border border-gray-300 p-2">{coStar.id}</td>
									<td className="border border-gray-300 p-2">{coStar.name}</td>
									<td className="border border-gray-300 p-2">{coStar.movieCount}</td>
									<td className="border border-gray-300 p-2">
										{coStar.movies.length > 0 ? coStar.movies.join(", ") : "N/A"}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
};

export default ActorConnections;
