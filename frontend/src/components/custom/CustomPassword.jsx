import { useState } from "react";
import PropTypes from "prop-types";
import EyeIcon from "@/components/svg/EyeIcon";
import "./CustomPassword.css";

const CustomPassword = ({label, password, onChange}) => {
	const [showPassword, setShowPassword] = useState(false);
	return (
		<div className="custom-password">
			<label>{label}</label>
			<div>
				<input
					type={showPassword ? "text": "password"}
					placeholder="Enter Password"
					value={password}
					onChange={(e) => onChange(e.target.value)}
				/>
				<button
					className="btn-icon"
					type="button"
					onClick={() => setShowPassword((p) => !p)}
				>
					<EyeIcon showSlash={showPassword}/>
				</button>
			</div>
		</div>
	);
};

CustomPassword.propTypes = {
	label: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
	password: PropTypes.string.isRequired
};

export default CustomPassword;
