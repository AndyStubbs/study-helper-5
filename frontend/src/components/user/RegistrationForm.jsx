import { useState } from "react";
import "./RegistrationForm.css";
import auth from "@/utils/auth";
import CustomPassword from "@/components/custom/CustomPassword";
import CustomLoading from "@/components/custom/CustomLoading";
import PropTypes from "prop-types";

const RegistrationForm = ({onSetShowLoginForm}) => {
	const [formData, setFormData] = useState({
		email: "astubbs50@gmail.com",
		password: "TestPassword1$",
		confirm: "TestPassword1$",
	});

	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(false);
	const [showLoading, setShowLoading] = useState(false);
	const handleChange = (name, value) => {
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError(null);
		setSuccess(false);

		if (formData.password !== formData.confirm) {
			setError("Passwords do not match.");
			return;
		}

		try {
			setShowLoading(true);
			await auth.register(formData.email, formData.password);
			setSuccess(true);
		} catch (err) {
			console.error("Registration failed:", err.message);
			setError(err.message || "Something went wrong. Please try again.");
		} finally {
			setShowLoading(false);
		}
	};

	return (
		<div className="registration-form">
			{error && <p className="error">{error}</p>}
			{success && <p className="success">Registration successful! You can now log in.</p>}
			<form onSubmit={handleSubmit}>
				<div>
					<label>Email</label>
					<input
						type="email"
						name="email"
						value={formData.email}
						onChange={(e) => handleChange("email", e.target.value)}
						required
					/>
				</div>
				<CustomPassword
					label="Password"
					password={formData.password}
					onChange={(password) => handleChange("password", password)}
				/>
				<CustomPassword
					label="Password"
					password={formData.confirm}
					onChange={(confirm) => handleChange("confirm", confirm)}
				/>
				<button type="submit" className="btn-full">Register</button>
			</form>
			<p>
				Already have an account? <span>&nbsp;&nbsp;</span>
				<button className="btn-link" onClick={() => onSetShowLoginForm(true)}>
					Login
				</button>
			</p>
			<CustomLoading isVisible={showLoading} />
		</div>
	);
};

RegistrationForm.propTypes = {
	onSetShowLoginForm: PropTypes.func.isRequired,
};

export default RegistrationForm;
