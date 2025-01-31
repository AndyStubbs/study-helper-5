import PropTypes from "prop-types";

const EyeIcon = ({showSlash}) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="20 20 60 60"
			stroke="currentColor"
		>
			<path d="M25,50 Q50,20 75,50 Q50,80 25,50 Z" fill="white" stroke="black" strokeWidth="2"></path>
			<circle cx="50" cy="50" r="10" fill="black"></circle>
			<circle cx="50" cy="50" r="5" fill="white"></circle>
			{
				showSlash &&
				<g>
					<line x1="24.5" y1="63.5" x2="74.5" y2="33.5" stroke="white" strokeWidth="3"></line>
					<line x1="26" y1="66" x2="76" y2="36" stroke="black" strokeWidth="3"></line>
				</g>
			}
		</svg>
	);
};

EyeIcon.propTypes = {
	showSlash: PropTypes.bool
};

export default EyeIcon;
