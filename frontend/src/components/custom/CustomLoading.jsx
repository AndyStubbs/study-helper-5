import PropTypes from "prop-types";
import "./CustomLoading.css";

const CustomLoading = ({isVisible}) => {
	if (!isVisible) return null;
	return (
		<div className="custom-loading">
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
			>
				<rect className="spinner-bar spinner-bar-delay2" x="1" y="6" width="2.8" height="12" fill="#888" />
				<rect className="spinner-bar spinner-bar-delay1" x="5.8" y="6" width="2.8" height="12" fill="#888" />
				<rect className="spinner-bar" x="10.6" y="6" width="2.8" height="12" fill="#888" />
				<rect className="spinner-bar spinner-bar-delay1" x="15.4" y="6" width="2.8" height="12" fill="#888" />
				<rect className="spinner-bar spinner-bar-delay2" x="20.2" y="6" width="2.8" height="12" fill="#888" />
			</svg>
		</div>
	);
}

CustomLoading.propTypes = {
	isVisible: PropTypes.bool.isRequired
};

export default CustomLoading;
