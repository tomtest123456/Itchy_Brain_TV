import * as React from "react"
import axios from "axios"
import { useParams, Link } from "react-router-dom"
import ActorMindmap from "./ActorMindmap"

const MOVIE_LIMIT = 50 // Maximum number of movies to process
const MIN_SHARED_MOVIES = 2 // Co-stars must appear in at least 2 movies

// Dynamic limits based on screen size
const getCostarLimit = (width) => {
	if (width < 640) return 5 // Mobile
	if (width < 1024) return 6 // Tablet
	return 8 // Desktop
}

const getTopBilledCastLimit = (width) => {
	if (width < 640) return 3 // Mobile
	if (width < 1024) return 4 // Tablet
	return 5 // Desktop
}

const ActorConnections = () => {
	const { actorId } = useParams()
	const [elements, setElements] = React.useState([])
	const [loading, setLoading] = React.useState(true)
	const [actorName, setActorName] = React.useState("")
	const [coStarData, setCoStarData] = React.useState([])
	const [movieCollectionsMap, setMovieCollectionsMap] = React.useState({})
	const [screenWidth, setScreenWidth] = React.useState(window.innerWidth)

	// Handle window resize
	React.useEffect(() => {
		const handleResize = () => {
			setScreenWidth(window.innerWidth)
		}

		window.addEventListener("resize", handleResize)
		return () => window.removeEventListener("resize", handleResize)
	}, [])

	React.useEffect(() => {
		const fetchActorConnections = async () => {
			try {
				const apiKey = process.env.REACT_APP_TMDB_API_KEY

				if (!actorId) {
					console.error("Error: actorId is undefined. Cannot proceed.")
					setLoading(false)
					return
				}

				// Get dynamic limits based on screen size
				const COSTAR_LIMIT = getCostarLimit(screenWidth)
				const TOP_BILLED_CAST_LIMIT = getTopBilledCastLimit(screenWidth)

				// Fetch actor details
				const actorResponse = await axios.get(`https://api.themoviedb.org/3/person/${actorId}?api_key=${apiKey}`)
				setActorName(actorResponse.data.name)

				const actorImage = actorResponse.data.profile_path
					? `https://image.tmdb.org/t/p/w500${actorResponse.data.profile_path}`
					: null

				// Fetch actor's movie credits
				const creditsResponse = await axios.get(
					`https://api.themoviedb.org/3/person/${actorId}/movie_credits?api_key=${apiKey}`,
				)

				if (!creditsResponse.data.cast || creditsResponse.data.cast.length === 0) {
					console.warn("No movie credits found for this actor.")
					setLoading(false)
					return
				}

				// Get movies sorted by popularity and limited by MOVIE_LIMIT
				const movies = creditsResponse.data.cast.sort((a, b) => b.popularity - a.popularity).slice(0, MOVIE_LIMIT)

				// Fetch all movie credits and details in parallel
				const [movieCreditsResponses, movieDetailsResponses] = await Promise.all([
					Promise.all(
						movies.map((movie) =>
							axios.get(`https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${apiKey}`),
						),
					),
					Promise.all(
						movies.map((movie) => axios.get(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${apiKey}`)),
					),
				])

				// Create a map of movie IDs to their collection and movie details
				const movieCollections = {}
				const moviesByCollection = {}
				const movieIds = {}

				movieDetailsResponses.forEach((response) => {
					const movie = response.data
					movieIds[movie.title] = movie.id

					if (movie.belongs_to_collection) {
						movieCollections[movie.id] = movie.belongs_to_collection.name
						if (!moviesByCollection[movie.belongs_to_collection.name]) {
							moviesByCollection[movie.belongs_to_collection.name] = []
						}
						moviesByCollection[movie.belongs_to_collection.name].push({
							title: movie.title,
							id: movie.id,
						})
					}
				})

				setMovieCollectionsMap(moviesByCollection)

				// Record co-star occurrences and the movies they appear in
				const coStarCount = {}
				const coStarMovies = {}
				const coStarCollections = {}

				movieCreditsResponses.forEach((response, index) => {
					const fullCast = response.data.cast || []
					const movieId = movies[index].id
					const movieTitle = movies[index].title
					const collectionName = movieCollections[movieId]

					fullCast.slice(0, TOP_BILLED_CAST_LIMIT).forEach((coStar) => {
						if (!coStar || !coStar.id || coStar.id === Number(actorId)) return

						if (!coStarCount[coStar.id]) {
							coStarCount[coStar.id] = 0
							coStarMovies[coStar.id] = []
							coStarCollections[coStar.id] = new Set()
						}

						coStarCount[coStar.id] += 1
						coStarMovies[coStar.id].push({
							title: movieTitle,
							id: movieId,
						})
						if (collectionName) {
							coStarCollections[coStar.id].add(collectionName)
						}
					})
				})

				// Sort co-stars by frequency and limit by COSTAR_LIMIT
				const sortedCoStars = Object.entries(coStarCount)
					.filter(([_, count]) => count >= MIN_SHARED_MOVIES)
					.sort((a, b) => b[1] - a[1])
					.slice(0, COSTAR_LIMIT)

				// Create Cytoscape elements with responsive sizes
				const nodes = [
					{
						data: {
							id: String(actorId),
							label: actorResponse.data.name,
							image: actorImage,
							type: "actor",
							size: screenWidth < 640 ? 80 : screenWidth < 1024 ? 100 : 120,
							fontSize: screenWidth < 640 ? 10 : screenWidth < 1024 ? 12 : 14,
						},
					},
				]

				const edges = []
				const coStarDetails = sortedCoStars.map(([coStarId, count]) => {
					const coStarInfo = movieCreditsResponses
						.flatMap((response) => response.data.cast || [])
						.find((coStar) => coStar.id === Number(coStarId))

					const coStarName = coStarInfo ? coStarInfo.name : `Unknown Actor (${coStarId})`
					const coStarImage =
						coStarInfo && coStarInfo.profile_path ? `https://image.tmdb.org/t/p/w500${coStarInfo.profile_path}` : null

					// Process collections and movies
					const collections = Array.from(coStarCollections[coStarId])
					const movies = coStarMovies[coStarId] || []

					// Create formatted movie list with movie IDs
					const moviesList =
						collections.length > 0
							? collections.map((collection) => ({
								text: `${collection} (${moviesByCollection[collection].length}x movies together)`,
								movies: moviesByCollection[collection],
							}))
							: movies.map((movie) => ({
								text: movie.title,
								id: movie.id,
							}))

					const formattedMoviesList = moviesList.map((m) => `• ${m.text}`).join("\n")

					return {
						id: coStarId,
						name: coStarName,
						movieCount: count,
						movies: movies,
						collections: collections,
						formattedMoviesList,
						moviesList,
						image: coStarImage,
					}
				})

				coStarDetails.forEach((coStar) => {
					const coStarNodeId = String(coStar.id)
					const movieListNodeId = `movies_${coStar.id}`

					// Add co-star node with responsive sizes
					nodes.push({
						data: {
							id: coStarNodeId,
							label: coStar.name,
							image: coStar.image,
							type: "actor",
							size: screenWidth < 640 ? 80 : screenWidth < 1024 ? 100 : 120,
							fontSize: screenWidth < 640 ? 10 : screenWidth < 1024 ? 12 : 14,
						},
					})

					// Add movie list node with responsive sizes
					nodes.push({
						data: {
							id: movieListNodeId,
							label: coStar.formattedMoviesList,
							type: "movie-list",
							moviesList: coStar.moviesList,
							fontSize: screenWidth < 640 ? 8 : screenWidth < 1024 ? 10 : 12,
							textMaxWidth: screenWidth < 640 ? 150 : screenWidth < 1024 ? 175 : 200,
							width: screenWidth < 640 ? 150 : screenWidth < 1024 ? 175 : 200,
						},
					})

					// Add main connection between actors with scaled width
					edges.push({
						data: {
							id: `edge_${actorId}_${coStar.id}`,
							source: String(actorId),
							target: coStarNodeId,
							movieCount:
								screenWidth < 640
									? Math.max(1, Math.min(4, coStar.movieCount))
									: Math.max(2, Math.min(8, coStar.movieCount)),
						},
					})

					// Add connection to movie list
					edges.push({
						data: {
							id: `edge_${coStar.id}_movies`,
							source: coStarNodeId,
							target: movieListNodeId,
						},
						classes: "movie-connection",
					})
				})

				setCoStarData(coStarDetails)
				setElements([...nodes, ...edges])
				setLoading(false)
			} catch (error) {
				console.error("Error fetching actor connections:", error)
				setLoading(false)
			}
		}

		fetchActorConnections()
	}, [actorId, screenWidth])

	return (
		<div className="flex flex-col items-center max-w-7xl mx-auto px-4 py-8">
			<h2 className="text-2xl font-bold mb-8">{loading ? "Loading..." : `Connections for ${actorName}`}</h2>
			{!loading && <ActorMindmap elements={elements} />}
			{!loading && coStarData.length > 0 && (
				<div className="mt-8 w-full">
					<h3 className="text-xl font-bold mb-4">Co-Stars</h3>
					<div className="overflow-x-auto">
						<table className="w-full border-collapse border border-gray-300">
							<thead>
								<tr className="bg-gray-100">
									<th className="border border-gray-300 p-2">Actor Name</th>
									<th className="border border-gray-300 p-2">Movies Together</th>
									<th className="border border-gray-300 p-2">Collaborations</th>
								</tr>
							</thead>
							<tbody>
								{coStarData.map((coStar) => (
									<tr key={coStar.id} className="hover:bg-gray-50">
										<td className="border border-gray-300 p-2">
											<Link to={`/actor/${coStar.id}`} className="text-blue-600 hover:underline">
												{coStar.name}
											</Link>
										</td>
										<td className="border border-gray-300 p-2 text-center">{coStar.movieCount}</td>
										<td className="border border-gray-300 p-2">
											{coStar.collections.length > 0
												? coStar.collections
													.map(
														(collection) =>
															`${collection} (${movieCollectionsMap[collection]?.length || 0}x movies together)`,
													)
													.join(", ")
												: coStar.movies.map((movie) => (
													<React.Fragment key={movie.id}>
														<Link to={`/movie/${movie.id}`} className="text-blue-600 hover:underline">
															{movie.title}
														</Link>
														{", "}
													</React.Fragment>
												))}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	)
}

export default ActorConnections

