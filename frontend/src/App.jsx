import { useState } from "react";
import PropTypes from "prop-types";
import MainHeader from "@/components/header/MainHeader";
import RegistrationForm from "@/components/user/RegistrationForm";
import LoginForm from "@/components/user/LoginForm";
import CustomModal from "@/components/custom/CustomModal";

const App = ({onToggleTheme}) => {
	const [isModalVisible, setModalVisible] = useState(false);

	return (
		<div>
			<MainHeader onToggleTheme={onToggleTheme} />
			<LoginForm />
			<hr />
			<RegistrationForm />
			<hr />
			<div>
				<button onClick={() => setModalVisible(true)}>Open Modal</button>
				<CustomModal
					title="My Modal"
					isVisible={isModalVisible}
					onClose={() => setModalVisible(false)}
					footer={<button onClick={() => setModalVisible(false)}>Close</button>}
				>
					<p>This is the modal content.</p>
				</CustomModal>
			</div>
		</div>
	);
};

export default App;

App.propTypes = {
	onToggleTheme: PropTypes.func
};
