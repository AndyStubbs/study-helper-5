import "./MainHeader.css";

import PropTypes from "prop-types";
import MenuIcon from "@/components/svg/MenuIcon";

const MainHeader = ({onOpenAccountModal}) => {
	return (
		<header className="main-header">
			<h2>Study Buddy Platform</h2>
			<div className="auth-links">
				<button
					onClick={onOpenAccountModal}
					className="btn btn-icon"
					title="Login/Register Account"
				>
					<MenuIcon />
				</button>
			</div>
		</header>
	);
}

export default MainHeader;

MainHeader.propTypes = {
	onOpenAccountModal: PropTypes.func.isRequired
};
