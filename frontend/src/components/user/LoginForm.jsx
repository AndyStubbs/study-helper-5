import { useState } from "react";
import PropTypes from "prop-types";
import auth from "@/utils/auth";
import CustomPassword from "@/components/custom/CustomPassword";
import CustomLoading from "@/components/custom/CustomLoading";
import "./LoginForm.css";

const LoginForm = ({ onSetShowLoginForm }) => {
	const [formData, setFormData] = useState({
		email: "astubbs50@gmail.com",
		password: "TestPassword1$",
	});
	const [showLoading, setShowLoading] = useState(false);

	const [error, setError] = useState(null);

	const handleChange = (name, value) => {
		console.log("Handle Change");
		console.log(name, value);
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError(null);

		try {
			setShowLoading(true);
			await auth.login(formData.email, formData.password);
		} catch (err) {
			setError(err.message);
		} finally {
			setShowLoading(false);
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
						onChange={(e) => handleChange("email", e.target.value)}
					/>
				</div>
				<CustomPassword
					label="Password"
					password={formData.password}
					onChange={(password) => handleChange("password", password)}
				/>
				<button type="submit" className="btn-full">Login</button>
			</form>
			<p>
				Don&apos;t have an account? <span>&nbsp;&nbsp;</span>
				<button className="btn-link" onClick={() => onSetShowLoginForm(false)}>
					Register
				</button>
			</p>
			<CustomLoading isVisible={showLoading} />
		</div>
	);
};

LoginForm.propTypes = {
	onSetShowLoginForm: PropTypes.func.isRequired,
};

export default LoginForm;
