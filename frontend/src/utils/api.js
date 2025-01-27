// utils/api.js

"use strict";

import axios from "axios";

const api = axios.create({
	baseURL: "/api",
	withCredentials: true,
	headers: {
		"Content-Type": "application/json",
	},
});

// Optional: Add interceptors for request/response handling
api.interceptors.response.use(
	(response) => response,
	(error) => {
		// Handle errors globally
		console.error("API Error:", error.response || error.message);
		return Promise.reject(error);
	}
);

export default api;
