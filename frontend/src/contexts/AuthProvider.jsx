/* eslint-disable react/prop-types */

import { useState, useEffect, useCallback } from "react";
import AuthContext from "./AuthContext";
import api from "@/utils/api";

const AuthProvider = ({ children }) => {
	const [authState, setAuthState] = useState({
		isAuthenticated: false,
		isLoggedIn: false,
		username: "",
		email: "",
	});

	// Function to check if the user is authenticated
	const checkAuth = useCallback(async () => {
		try {
			const response = await api.get("/users/check-auth/", { withCredentials: true });
			setAuthState({
				isAuthenticated: true,
				isLoggedIn: true,
				username: response.data.username,
				email: response.data.email,
			});
		} catch {
			setAuthState({
				isAuthenticated: false,
				isLoggedIn: false,
				username: "",
				email: "",
			});
		}
	}, []);

	// Function to handle login
	const login = useCallback(async (email, password) => {
		try {
			await api.post("/users/login/", { email, password }, { withCredentials: true });
			await checkAuth();
		} catch (error) {
			throw new Error(error.response?.data?.detail || "Login failed. Please try again.");
		}
	}, [checkAuth]);

	// Function to handle registration
	const register = useCallback(async (username, email, password) => {
		try {
			await api.post("/users/register/", { username, email, password });
			await login(email, password);
		} catch (error) {
			throw new Error(
				error.response?.data?.detail || "Registration failed. Please try again."
			);
		}
	}, [login]);

	// Function to handle logout
	const logout = useCallback(async () => {
		try {
			await api.post("/users/logout/", {}, { withCredentials: true });
			setAuthState({
				isAuthenticated: false,
				isLoggedIn: false,
				username: "",
				email: "",
			});
		} catch (error) {
			console.error("Logout failed:", error.message);
		}
	}, []);

	// Function to delete the account
	const deleteAccount = useCallback(async () => {
		try {
			await api.delete("/users/delete-user/", { withCredentials: true });
			await logout(); // Log out after account deletion
		} catch (error) {
			throw new Error(error.response?.data?.error || "Failed to delete account.");
		}
	}, [logout]);

	// Restore authentication state on initial load
	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	return (
		<AuthContext.Provider value={{ ...authState, register, login, logout, deleteAccount }}>
			{children}
		</AuthContext.Provider>
	);
};

export default AuthProvider;
