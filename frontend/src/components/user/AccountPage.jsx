import { useState, useEffect } from "react";
import auth from "@/utils/auth";
import "./AccountPage.css";
import CustomConfirm from "@/components/custom/CustomConfirm";

const AccountPage = () => {

	const [showConfirmMessage, setShowConfirmMessage] = useState(false);
	const [email, setEmail] = useState("example@email.com");

	function handleDelete() {
		setShowConfirmMessage(true);
	}

	function confirmDelete() {
		auth.deleteAccount();
	}

	function cancelDelete() {
		setShowConfirmMessage(false);
	}

	function handleLogout() {
		auth.logout();
	}

	useEffect(() => {
		function handleAuthChange(authData) {
			setEmail(authData.email);
		}
		auth.watchAuthData(handleAuthChange, true);
	}, [setEmail]);

	return (
		<div className="account-page">
			<p>
				<span className="email-title">Email:</span> <span>{email}</span>
			</p>
			<button onClick={handleLogout}>Logout</button>
			<button onClick={handleDelete}>Delete Account</button>
			<CustomConfirm
				isVisible={showConfirmMessage}
				title="Delete Account"
				message="Are you sure you want to delete your account?"
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
			/>
		</div>
	);
};

export default AccountPage;
