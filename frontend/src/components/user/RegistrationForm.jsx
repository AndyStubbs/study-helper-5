import { useState } from "react";
import "./RegistrationForm.css";
import api from "@/utils/api";

const RegistrationForm = () => {
	const [formData, setFormData] = useState({
		email: "astubbs50@gmail.com",
		password: "TestPassword1$",
	});

	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(false);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError(null);
		setSuccess(false);

		try {
			const response = await api.post("/users/register/", formData);
			console.log("Registration successful:", response.data);
			setSuccess(true);
		} catch (err) {
			console.error("Registration failed:", err.response?.data || err.message);
			setError(err.response?.data?.detail || "Something went wrong. Please try again.");
		}
	};

	return (
		<div className="registration-form">
			<h2>Register</h2>
			{error && <p className="error">{error}</p>}
			{success && <p className="success">Registration successful! You can now log in.</p>}
			<form onSubmit={handleSubmit}>
				<div>
					<label>Email</label>
					<input
						type="email"
						name="email"
						value={formData.email}
						onChange={handleChange}
						required
					/>
				</div>
				<div>
					<label>Password</label>
					<input
						type="password"
						name="password"
						value={formData.password}
						onChange={handleChange}
						required
					/>
				</div>
				<div>
					<label>Confirm</label>
					<input
						type="password"
						name="confirm"
						value={formData.password}
						onChange={handleChange}
						required
					/>
				</div>
				<button type="submit">Register</button>
			</form>
		</div>
	);
};

export default RegistrationForm;
