import { useState, useEffect } from "react";
import auth from "@/utils/auth";
import MainHeader from "@/components/header/MainHeader";
import RegistrationForm from "@/components/user/RegistrationForm";
import LoginForm from "@/components/user/LoginForm";
import CustomModal from "@/components/custom/CustomModal";
import AccountPage from "@/components/user/AccountPage";

const App = () => {
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [showLoginForm, setShowLoginForm] = useState(true);
	const [showAccountModal, setShowAccountModal] = useState(false);


	function onSetShowLoginForm(isShowLoginForm) {
		console.log(isShowLoginForm);
		setShowLoginForm(isShowLoginForm);
	}

	function onOpenAccountModal() {
		setShowAccountModal(true);
	}

	function onCloseAccountModal() {
		setShowAccountModal(false);
	}

	useEffect(() => {
		function handleAuthChange(authData) {
			setShowLoginModal(!authData.isAuthenticated);
			if (showAccountModal && !authData.isAuthenticated) {
				setShowAccountModal(false);
			}
		}
		auth.watchAuthData(handleAuthChange);
	}, [showAccountModal]);

	return (
		<main>
			<MainHeader onOpenAccountModal={onOpenAccountModal} />
			<CustomModal title={showLoginForm ? "Login" : "Register"} isVisible={showLoginModal}>
			{
				showLoginForm ? (
					<LoginForm onSetShowLoginForm={onSetShowLoginForm} />
				) : (
					<RegistrationForm onSetShowLoginForm={onSetShowLoginForm} />
				)
			}
			</CustomModal>
			<CustomModal title="Account" isVisible={showAccountModal} onClose={onCloseAccountModal}>
				<AccountPage />
			</CustomModal>
		</main>
	);
};

export default App;
