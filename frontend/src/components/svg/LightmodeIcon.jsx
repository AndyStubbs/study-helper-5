import "./LightmodeIcon.css";

export default function LightmodeIcon() {
	return (
		<svg
			className="lightmode-icon"
			width="30"
			height="30"
			viewBox="0 0 30 30"
			xmlns="http://www.w3.org/2000/svg"
		>
			<circle cx="15" cy="15" r="6" fill="#eee" />
			<line
				id="ray"
				stroke="#eee"
				strokeWidth="2"
				strokeLinecap="round"
				x1="15"
				y1="1"
				x2="15"
				y2="4"
			></line>

			<use href="#ray" transform="rotate(45 15 15)" />
			<use href="#ray" transform="rotate(90 15 15)" />
			<use href="#ray" transform="rotate(135 15 15)" />
			<use href="#ray" transform="rotate(180 15 15)" />
			<use href="#ray" transform="rotate(225 15 15)" />
			<use href="#ray" transform="rotate(270 15 15)" />
			<use href="#ray" transform="rotate(315 15 15)" />
		</svg>
	);
}
