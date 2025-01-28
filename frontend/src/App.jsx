import RegistrationForm from "@/components/user/RegistrationForm";
import LoginForm from "@/components/user/LoginForm";

const App = () => {
	return (
		<div className="App">
			<h1>Welcome to the App</h1>
			<LoginForm />
			<hr />
			<RegistrationForm />
		</div>
	);
};

export default App;
