// src/index.js

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { validateEnvironment } from './utils/env';

import "bulma/css/bulma.min.css";
import "./main.scss"; // This must be after the Bulma line above, otherwise it will not override Bulma's styles

// Validate environment variables on startup
validateEnvironment();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
	<React.StrictMode>
		<BrowserRouter>
			<App />
		</BrowserRouter>
	</React.StrictMode>
);
