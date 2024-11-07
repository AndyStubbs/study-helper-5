// static/js/topic_generator.js

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
			descriptionArea.value = data.summary;
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

} )();
