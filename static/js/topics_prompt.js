// static/js/topic_prompt.js


( function () {
	/* global main */

	// Setup input
	const m_input = document.querySelector( "#topic-prompt input[name='topic']" );
	m_input.addEventListener( "keydown", function ( event ) {
		if( event.key === "Enter" ) {
			event.preventDefault();
			submitTopic();
		}
	} );
	m_input.focus();

	// Setup reset button
	const resetButton = document.querySelector( "#reset-btn" );
	resetButton.addEventListener( "click", resetPrompt );

	// Setup continue button
	let m_topicName = "";
	let m_topicDescription = "";
	const continueButton = document.querySelector( "#continue-btn" );
	continueButton.addEventListener( "click", selectTopic );

	function submitTopic() {
		const topic = m_input.value.trim();
		if( topic ) {
			m_input.disabled = true;
			const promptMessage = document.querySelector( "#prompt-message" );
			const promptLoading = document.querySelector( "#prompt-loading" );
			const promptResponse = document.querySelector( "#prompt-response" );
			const promptError = document.querySelector( "#prompt-error" );
			promptMessage.style.display = "none";
			promptLoading.style.display = "";
			promptResponse.style.display = "none";
			fetch( "/topics/process/", {
				"method": "POST",
				"headers": {
					"Content-Type": "application/json",
					"X-CSRFToken": main.getCSRFToken()
				},
				"body": JSON.stringify( { "topic": topic } )
			} )
			.then( response => {
				if( !response.ok ) {
					throw new Error( `Server error: ${response.status}` );
				}
				return response.json();
			} )
			.then( data => {
				
				m_topicName = topic;
				m_topicDescription = data.summary;

				// Hide error message
				promptError.style.display = "none";

				// Hide the loading bar
				promptLoading.style.display = "none";

				// Update the topic name
				const topicName = document.querySelector( "#topic-name" );
				topicName.innerHTML = m_topicName;

				// Update topic summary
				const topicSummary = document.querySelector( "#topic-summary" );
				topicSummary.innerHTML = data.summary;

				// Update suggestions
				const topicSuggestions = document.querySelector( "#topic-suggestions" );
				topicSuggestions.innerHTML = "";
				for( let i = 0; i < data.suggestions.length; i += 1 ) {

					// Create the suggestion button
					const button = document.createElement( "button" );
					button.dataset.topic = data.suggestions[ i ];
					button.innerHTML = data.suggestions[ i ];
					button.title = data.suggestions[ i ];
					button.addEventListener( "click", ( e ) => {
						m_topicName = e.target.dataset.topic;
						m_topicDescription = "";
						selectTopic();
					} );

					// Add the suggestion to the list
					const suggestion = document.createElement( "li" );
					suggestion.appendChild( button );
					topicSuggestions.appendChild( suggestion );
				}

				// Unhide prompt response
				promptResponse.style.display = "";

				// Hide input
				m_input.style.display = "none";
			} )
			.catch( error => {
				console.error( "Error processing topic:", error );

				// Show Error Message
				promptError.innerHTML = "Something went wrong.";
				promptError.style.display = "";

				resetPrompt();
			} );
		}
	}

	function resetPrompt() {
		const input = document.querySelector( "#topic-prompt input[name='topic']" );
		const promptMessage = document.querySelector( "#prompt-message" );
		const promptLoading = document.querySelector( "#prompt-loading" );
		const promptResponse = document.querySelector( "#prompt-response" );

		// Hide prompt response
		promptResponse.style.display = "none";

		// Hide loading bars
		promptLoading.style.display = "none";

		// Show Prompt message
		promptMessage.style.display = "";

		
		// Reset the input prompt
		input.style.display = "";
		input.disabled = false;
		input.focus();
	}

	function selectTopic() {
		alert( m_topicName + ": " + m_topicDescription );
	}

} )();
