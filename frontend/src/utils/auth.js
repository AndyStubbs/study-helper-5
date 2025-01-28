import api from "@/utils/api";

const REFRESH_BUFFER = 10000;
const authData = {
	isAuthenticated: false,
	username: "",
	email: "",
	tokenExp: -1
};

let refreshTimeout = null;

// Reset the auth data
function resetAuthData() {
	authData.isAuthenticated = false;
	authData.username = "";
	authData.email = "";
	authData.tokenExp = -1;
	clearTimeout(refreshTimeout);
}

function updateAuthData(username, email, tokenExp) {
	authData.isAuthenticated = true;
	authData.username = username;
	authData.email = email;
	authData.tokenExp = tokenExp;
	scheduleRefreshToken(tokenExp);
}

// Check if the user is authenticated
async function checkAuth() {
	try {
		const response = await api.get("/users/check-auth/", { withCredentials: true });
		const data = response.data;
		console.log(data);
		if (data.is_authenticated) {
			updateAuthData(data.username, data.email, data.token_exp);
		} else {
			resetAuthData();
		}
	} catch {
		resetAuthData();
	}
}

// Function to handle login
async function login(email, password) {
	try {
		await api.post("/users/login/", { email, password }, { withCredentials: true });
		await checkAuth();
	} catch (error) {
		throw new Error(error.response?.data?.detail || "Login failed. Please try again.");
	}
}

// Function to handle registration
async function register(email, password) {
	try {
		await api.post("/users/register/", { email, password });
		await login(email, password);
	} catch (error) {
		throw new Error(
			error.response?.data?.detail || "Registration failed. Please try again."
		);
	}
}

// Function to handle logout
async function logout() {
	try {
		await api.post("/users/logout/", {}, { withCredentials: true });
		resetAuthData();
	} catch (error) {
		console.error("Logout failed:", error.message);
	}
}

// Delete the account
async function deleteAccount() {
	try {
		await api.delete("/users/delete-user/", { withCredentials: true });
		await logout();
	} catch (error) {
		throw new Error(error.response?.data?.error || "Failed to delete account.");
	}
}

// Refresh token
async function refreshToken() {
	const response = await api.post("/users/token-refresh/", {});
	if (response) {
		const data = response.data;
		scheduleRefreshToken(data.token_exp);
	} else {
		resetAuthData();
	}
}

// Schedule token refresh
function scheduleRefreshToken(expirationTime) {
	clearTimeout(refreshTimeout);
	const expirationTimeMS = expirationTime * 1000;
	const expiresIn = expirationTimeMS - Date.now();
	let refreshTime = 0;
	if (expiresIn > 0) {
		refreshTime = Math.max(expiresIn - REFRESH_BUFFER, 1000);
	}
	refreshTimeout = setTimeout(() => {
		refreshToken();
	}, refreshTime);

	console.log(`Token refresh scheduled for ${refreshTime / 1000} seconds`);
}

export default {
	checkAuth,
	login,
	register,
	deleteAccount
};
