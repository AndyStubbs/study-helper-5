// Simulated database of topics and their related information
const topicsDatabase = {
	"JavaScript": {
		description: "JavaScript is a high-level, interpreted programming language that is a core technology of the World Wide Web.",
		suggestions: ["TypeScript", "React", "Node.js", "Vue.js", "Angular", "Express.js"]
	},
	"Machine Learning": {
		description: "Machine Learning is a subset of artificial intelligence that provides systems the ability to automatically learn and improve from experience without being explicitly programmed.",
		suggestions: ["Deep Learning", "Neural Networks", "Natural Language Processing", "Computer Vision", "Reinforcement Learning", "Data Science"]
	}
};

// Function to generate random suggestions
function generateRandomSuggestions(topic, count = 6) {
	const allWords = topic.split(' ');
	const suggestions = [];
	for (let i = 0; i < count; i++) {
		const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
		suggestions.push(`${randomWord} ${Math.random().toString(36).substring(7)}`);
	}
	return suggestions;
}

// Simulated /topics/process/ endpoint
async function processTopicEndpoint(topic) {
	console.log(`Processing topic: ${topic}`);
	
	// Simulate network delay
	await new Promise(resolve => setTimeout(resolve, 500));
	
	if (topicsDatabase[topic]) {
		return topicsDatabase[topic];
	} else {
		return {
			description: `${topic} is a fascinating subject that encompasses various aspects and applications in modern society.`,
			suggestions: generateRandomSuggestions(topic)
		};
	}
}

// Simulated /topics/summarize/ endpoint
async function summarizeTopicEndpoint(topic) {
	console.log(`Summarizing topic: ${topic}`);
	
	// Simulate network delay
	await new Promise(resolve => setTimeout(resolve, 300));
	
	return {
		description: `${topic} is an intriguing area of study with wide-ranging implications and applications across multiple disciplines.`
	};
}

// Simulated server request handler
async function handleRequest(endpoint, data) {
	const loadingOverlay = document.getElementById('loading-overlay');
	loadingOverlay.style.visibility = 'visible';
	try {
		switch (endpoint) {
			case '/topics/process/':
				return await processTopicEndpoint(data.topic);
			case '/topics/summarize/':
				return await summarizeTopicEndpoint(data.topic);
			default:
				throw new Error('Unknown endpoint');
		}
	} finally {
		loadingOverlay.style.visibility = 'hidden';
	}
}