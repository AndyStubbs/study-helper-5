// static/js/topic_prompt.js
// TODO: When the user selects a similar topic, it should stay highlighted when selected.
// 		 If the user enters a new topic manually it should no longer be highlighted.
// TODO: Need to rename this file and view to something better like create_topic.

( function () {
	/* global main */

	const form = document.getElementById( "topic-form" );
	const topicInput = document.getElementById( "topic-input" );
	const submitBtn = document.getElementById( "submit-btn" );
	const resultArea = document.getElementById( "result-area" );
	const descriptionArea = document.getElementById( "description" );
	const suggestionsList = document.getElementById( "suggestions" );

	form.addEventListener( "submit", async ( e ) => {
		e.preventDefault();
		await processTopic( topicInput.value );
	} );

	async function processTopic( topic ) {
		const loadingOverlay = document.getElementById( "loading-overlay" );
		try {
			loadingOverlay.style.visibility = "visible";
			const data = await main.handleRequest( "/topics/process/", { topic } );
			updateUI( data );
		} catch ( error ) {
			console.error( "Error:", error );
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
		} catch ( error ) {
			console.error( "Error:", error );
		} finally {
			loadingOverlay.style.visibility = "hidden";
		}
	}

	function updateUI( data ) {
		resultArea.style.display = "block";
		descriptionArea.value = data.summary;
		
		suggestionsList.innerHTML = "";
		data.suggestions.forEach( suggestion => {
			const li = document.createElement( "li" );
			li.textContent = suggestion;
			li.addEventListener( "click", () => {
				topicInput.value = suggestion;
				processTopic( suggestion );
			} );
			suggestionsList.appendChild( li );
		} );

		descriptionArea.removeAttribute( "readonly" );
		submitBtn.textContent = "Update";
		document.getElementById( "final-submit-btn" ).style.display = "block";
	}

	topicInput.addEventListener( "keypress", ( event ) => {
		if( event.key === "Enter" ) {
			if( resultArea.style.display === "block" ) {
				summarizeTopic( topicInput.value );
			}
		}
	} );

} )();
