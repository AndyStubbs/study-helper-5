import { useState } from "react";
import auth from "@/utils/auth";
import "./AccountPage.css";
import CustomConfirm from "@/components/custom/CustomConfirm";

const AccountPage = () => {

	const [showConfirmMessage, setShowConfirmMessage] = useState(false);

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

	return (
		<div className="account-page">
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
