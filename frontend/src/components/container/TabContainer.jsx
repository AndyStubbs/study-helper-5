import { useState } from "react";
import TabTopics from "./TabTopics";
import TabHistory from "./TabHistory";
import TabAbout from "./TabAbout";
import "./TabContainer.css";

const tabs = [
	{name: "topics", label: "Topics", content: <TabTopics />},
	{name: "history", label: "History", content: <TabHistory />},
	{name: "about", label: "About", content: <TabAbout />},
];

const TabContainer = () => {
	const [tab, setTab] = useState("topics");
	return (
		<div className="tab-container">
			<div className="tab-buttons">
				{
					tabs.map(({name, label}) => (
						<button
							key={name}
							onClick={() => setTab(name)}
							className={tab === name ? "tab active" : "tab"}
						>
							{label}
						</button>
					))
				}
			</div>
			<div className="tab-contents">
				{
					tabs.find(tabItem => tabItem.name === tab).content
				}
			</div>
		</div>
	);
};

export default TabContainer;
