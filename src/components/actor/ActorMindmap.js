import React from "react";
import CytoscapeComponent from "react-cytoscapejs";

const ActorMindmap = ({ elements }) => {
	return (
		<div className="flex flex-col items-center">
			<h2 className="text-2xl font-bold mb-4">Actor Connections</h2>
			{elements.length > 1 ? (
				<CytoscapeComponent
					elements={elements}
					style={{ width: "80vw", height: "500px", border: "1px solid black" }}
					layout={{ name: "cose" }}
					stylesheet={[]}
				/>
			) : (
				<p>No connections found.</p>
			)}
		</div>
	);
};

export default ActorMindmap;
