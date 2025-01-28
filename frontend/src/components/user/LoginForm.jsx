import { useState } from "react";
import useAuth from "@/contexts/useAuth";
import "./LoginForm.css";

const LoginForm = () => {
	const { login } = useAuth();
	const [formData, setFormData] = useState({
		email: "astubbs50@gmail.com",
		password: "TestPassword1$",
	});

	const [error, setError] = useState(null);

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

		try {
			await login(formData.email, formData.password);
			alert("Login successful!");
		} catch (err) {
			setError(err.message);
		}
	};

	return (
		<div className="login-form">
		<form onSubmit={handleSubmit}>
			{error && <p style={{ color: "red" }}>{error}</p>}
			<div>
				<label>Email</label>
				<input
					type="email"
					placeholder="Email"
					value={formData.email}
					onChange={(e) => handleChange(e.target.value)}
				/>
			</div>
			<div>
				<label>Password</label>
				<input
					type="password"
					placeholder="Password"
					value={formData.password}
					onChange={(e) => handleChange(e.target.value)}
				/>
			</div>
			<button type="submit">Login</button>
		</form>
		</div>
	);
};

export default LoginForm;
