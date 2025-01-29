import "./DarkmodeIcon.css";

export default function DarkmodeIcon() {
	return (
		<svg
			className="darkmode-icon"
			width="30"
			height="30"
			viewBox="0 0 30 30"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				fill="#333"
				d="
					M 23, 5
					A 12 12 0 1 0 23, 25
					A 12 12 0 0 1 23, 5
				"
			/>
		</svg>
	);
}
