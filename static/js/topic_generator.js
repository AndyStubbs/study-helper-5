// static/js/topic_generator.js

/* global window.main */

window.main.onReady( () => {

	const form = document.getElementById( "topic-form" );
	const topicInput = document.getElementById( "topic-input" );
	const submitBtn = document.getElementById( "submit-btn" );
	const resultArea = document.getElementById( "result-area" );
	const descriptionArea = document.getElementById( "description" );
	const suggestionsList = document.getElementById( "suggestions" );
	const saveTopicBtn = document.getElementById( "save-topic-btn" );

	form.addEventListener( "submit", async ( e ) => {
		e.preventDefault();
		await evaluateTopic( topicInput.value );
	} );

	saveTopicBtn.addEventListener( "click", async ( e ) => {
		e.preventDefault();
		await saveTopic( topicInput.value, descriptionArea.value );
	} );

	async function evaluateTopic( topic_name ) {
		const loadingOverlay = document.getElementById( "loading-overlay" );
		try {
			loadingOverlay.style.visibility = "visible";
			const data = await main.handleRequest( "/topics/evaluate/", { topic_name } );
			updateUI( data );
			document.querySelector( ".result-message" ).textContent = "";
		} catch ( error ) {
			console.error( "Error:", error );
			const resultMessage = document.querySelector( ".result-message" );
			resultMessage.classList.remove( "result-success" );
			resultMessage.classList.add( "result-error" );
			resultMessage.textContent = error;
		} finally {
			loadingOverlay.style.visibility = "hidden";
		}
	}

	async function summarizeTopic( topic ) {
		const loadingOverlay = document.getElementById( "loading-overlay" );
		try {
			loadingOverlay.style.visibility = "visible";
			const data = await main.handleRequest( "/topics/summarize/", { topic } );
			descriptionArea.value = data.description;
			document.querySelector( ".result-message" ).textContent = "";
		} catch ( error ) {
			console.error( "Error:", error );
			const resultMessage = document.querySelector( ".result-message" );
			resultMessage.classList.remove( "result-success" );
			resultMessage.classList.add( "result-error" );
			resultMessage.textContent = error;
		} finally {
			loadingOverlay.style.visibility = "hidden";
		}
	}

	function updateUI( data ) {
		resultArea.style.display = "block";
		descriptionArea.value = data.description;
		
		suggestionsList.innerHTML = "";
		data.suggestions.forEach( suggestion => {
			const li = document.createElement( "li" );
			li.textContent = suggestion;
			li.addEventListener( "click", () => {
				topicInput.value = suggestion;
				suggestionsList.querySelectorAll( ".selected" ). forEach( selected_li => {
					selected_li.classList.remove( "selected" );
				} );
				li.classList.add( "selected" );
				summarizeTopic( suggestion );
			} );
			suggestionsList.appendChild( li );
		} );

		descriptionArea.removeAttribute( "readonly" );
		submitBtn.textContent = "Update";
	}

	async function saveTopic( topicName, topicDescription ) {
		const loadingOverlay = document.getElementById( "loading-overlay" );
		try {
			loadingOverlay.style.visibility = "visible";
			const topic = await main.handleRequest( "/topics/save/", {
				"name": topicName,
				"description": topicDescription
			} );
			let topicLi = document.querySelector( `[data-topic-id='${topic.id}']` );
			let truncated = topic.description.split( " " ).slice( 0, 30 ).join( " " ) + "... ▼";
			let shortStyle = "style='display: none;'";
			let fullStyle = "";
			if( truncated.length < description.length ) {
				shortStyle = "";
				fullStyle = "style='display: none;'";
			}
			if( topicLi ) {
				topicLi.querySelector( ".short" ).innerHTML = truncated;
				topicLi.querySelector( ".full" ).innerHTML = topic.description;
			} else {
				topicLi = document.createElement( "li" );
				topicLi.dataset.topicId = topic.id;
				topicLi.innerHTML = `
					<h3>${ topic.name }</h3>
					<div>
						<p class="short" ${ shortStyle }>${ truncated }</p>
						<p class="full" ${ fullStyle }>${ topic.description }</p>
					</div>
					<button onclick="window.main.editTopic('${ topic.id }')">Edit</button>
					<button onclick="window.main.quizTopic('${ topic.id }')">Quiz</button>
				`;
				document.querySelector( "#topics-list" ).appendChild( topicLi );
			}
			const resultMessage = document.querySelector( ".result-message" );
			resultMessage.classList.remove( "result-error" );
			resultMessage.classList.add( "result-success" );
			resultMessage.textContent = "Topic saved successfully!";
		} catch ( error ) {
			console.error( "Error:", error );
			const resultMessage = document.querySelector( ".result-message" );
			resultMessage.classList.remove( "result-success" );
			resultMessage.classList.add( "result-error" );
			resultMessage.textContent = error;
		} finally {
			loadingOverlay.style.visibility = "hidden";
		}
	}

} );
