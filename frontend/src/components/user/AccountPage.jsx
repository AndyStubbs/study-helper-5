import auth from "@/utils/auth";
import "./AccountPage.css";

const AccountPage = () => {
	return (
		<div className="account-page">
			<button onClick={auth.logout}>Logout</button>
			<button onClick={auth.deleteAccount}>Delete Account</button>
		</div>
	);
};


export default AccountPage;
