import "./MainHeader.css";

import PropTypes from "prop-types";
import LightmodeIcon from  "@/components/svg/LightmodeIcon";
import DarkmodeIcon from  "@/components/svg/DarkmodeIcon";
import MenuIcon from "@/components/svg/MenuIcon";

const MainHeader = ({onToggleTheme}) => {
	function openAccountModal() {

	}

	return (
		<header className="main-header">
			<h2>Study Buddy Platform</h2>
			<div className="other-links">
				<div className="theme-toggle">
					<button
						onClick={onToggleTheme}
						className="btn btn-icon"
						title="Toggle Light/Dark Mode"
					>
						<LightmodeIcon />
						<DarkmodeIcon />
					</button>
				</div>
				<div className="auth-links">
					<button
						onClick={openAccountModal}
						className="btn btn-icon"
						title="Login/Register Account"
					>
						<MenuIcon />
					</button>
				</div>
			</div>
		</header>
	);
}

export default MainHeader;

MainHeader.propTypes = {
	onToggleTheme: PropTypes.func,
	theme: PropTypes.string
};
