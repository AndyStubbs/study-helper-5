import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import LightmodeIcon from  "@/components/svg/LightmodeIcon";
import DarkmodeIcon from  "@/components/svg/DarkmodeIcon";
import App from "./App.jsx";
import auth from "@/utils/auth";

function onToggleTheme() {
	if (document.body.classList.contains("dark")) {
		document.body.classList.remove("dark");
		document.body.classList.add("light");
	} else {
		document.body.classList.remove("light");
		document.body.classList.add("dark");
	}
}

auth.checkAuth();

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<App onToggleTheme={onToggleTheme} />
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
	</StrictMode>,
);
