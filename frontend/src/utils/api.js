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

api.interceptors.response.use(
	(response) => response,
	(error) => {
		console.error("API Error:", error.response || error.message);
		return Promise.reject(error);
	}
);

export default api;
