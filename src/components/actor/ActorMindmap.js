import * as React from "react"
import CytoscapeComponent from "react-cytoscapejs"
import { useNavigate } from "react-router-dom"

const ActorMindmap = ({ elements }) => {
  const cyRef = React.useRef(null)
  const navigate = useNavigate()

  // Memoize the layout configuration to prevent unnecessary re-renders
  const layout = React.useMemo(
    () => ({
      name: "concentric",
      fit: true,
      padding: 50,
      startAngle: Math.PI / 2,
      sweep: 2 * Math.PI,
      clockwise: true,
      equidistant: true,
      minNodeSpacing: 100,
      concentric: (node) => {
        // Main actor at center (level 0)
        if (node.data("type") === "actor" && !node.incomers().length) return 2
        // Co-stars at level 1
        if (node.data("type") === "actor") return 1
        // Movie lists at outermost level
        return 0
      },
      levelWidth: () => 1,
    }),
    [],
  )

  const stylesheet = React.useMemo(
    () => [
      {
        selector: "node[type='actor']",
        style: {
          width: 120,
          height: 120,
          "background-fit": "cover",
          "background-image": "data(image)",
          "background-color": "#ffffff",
          "border-color": "#6366f1",
          "border-width": 3,
          "border-opacity": 0.8,
          shape: "rectangle",
        },
      },
      {
        selector: "node[type='movie-list']",
        style: {
          "background-color": "#f0f9ff",
          "border-color": "#93c5fd",
          "border-width": 2,
          "border-opacity": 1,
          shape: "rectangle",
          padding: 12,
          color: "#1e40af",
          "font-size": "12px",
          "text-wrap": "wrap",
          "text-max-width": 200,
          "text-valign": "center",
          "text-halign": "center",
          label: "data(label)",
          width: 200,
          height: "auto",
        },
      },
      {
        selector: "node[type='actor'][label]",
        style: {
          label: "data(label)",
          "text-background-color": "#ffffff",
          "text-background-opacity": 1,
          "text-background-padding": 8,
          "text-border-color": "#e2e8f0",
          "text-border-width": 1,
          "text-border-opacity": 1,
          color: "#1e293b",
          "font-size": "14px",
          "font-weight": 600,
          "text-valign": "bottom",
          "text-margin-y": 8,
        },
      },
      {
        selector: "edge",
        style: {
          width: "data(movieCount)",
          "line-color": "#6366f1",
          "line-opacity": 0.6,
          "curve-style": "straight",
          "target-arrow-shape": "none",
        },
      },
      {
        selector: "edge.movie-connection",
        style: {
          "line-color": "#93c5fd",
          width: 1,
          "line-opacity": 0.4,
          "curve-style": "straight",
        },
      },
      {
        selector: "node:selected",
        style: {
          "border-color": "#4f46e5",
          "border-width": 4,
        },
      },
      {
        selector: "edge:selected",
        style: {
          "line-color": "#4f46e5",
          "line-opacity": 1,
        },
      },
    ],
    [],
  )

  React.useEffect(() => {
    if (cyRef.current) {
      // Set up zoom limits and sensitivity
      cyRef.current.minZoom(0.75)
      cyRef.current.maxZoom(1.5)

      // Custom zoom handling with fine-grained control
      const handleZoom = (event) => {
        event.preventDefault()
        const delta = event.originalEvent.deltaY
        const zoomFactor = delta > 0 ? 0.98 : 1.02 // Smaller zoom steps

        const currentZoom = cyRef.current.zoom()
        const newZoom = currentZoom * zoomFactor

        // Ensure zoom stays within bounds
        if (newZoom >= 0.75 && newZoom <= 1.5) {
          cyRef.current.zoom({
            level: newZoom,
            renderedPosition: {
              x: event.renderedPosition.x,
              y: event.renderedPosition.y,
            },
          })
        }
      }

      // Handle node clicks for navigation
      const handleNodeTap = (event) => {
        const node = event.target
        const nodeData = node.data()

        if (nodeData.type === "actor") {
          navigate(`/actor/${nodeData.id}`)
        } else if (nodeData.type === "movie-list" && nodeData.moviesList) {
          // If it's a collection, navigate to the first movie in the collection
          const firstMovie = nodeData.moviesList[0]
          if (firstMovie && firstMovie.id) {
            navigate(`/movie/${firstMovie.id}`)
          }
        }
      }

      cyRef.current.on("mousewheel", handleZoom)
      cyRef.current.on("tap", "node", handleNodeTap)

      // Initial layout and positioning
      cyRef.current.layout(layout).run()
      cyRef.current.fit()
      cyRef.current.center()

      // Cleanup
      return () => {
        if (cyRef.current) {
          cyRef.current.removeListener("mousewheel")
          cyRef.current.removeListener("tap")
        }
      }
    }
  }, [navigate, layout])

  const containerStyle = {
    width: "100%",
    paddingTop: "56.25%", // 16:9 aspect ratio
    position: "relative",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    overflow: "hidden",
  }

  const cytoscapeStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#f8fafc",
  }

  return (
    <div style={containerStyle}>
      <CytoscapeComponent
        elements={elements}
        style={cytoscapeStyle}
        layout={layout}
        stylesheet={stylesheet}
        cy={(cy) => {
          cyRef.current = cy
        }}
      />
    </div>
  )
}

export default ActorMindmap

