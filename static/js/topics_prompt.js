// static/js/topic_prompt.js


( function () {
	/* global main */

	const m_promptMessage = document.querySelector( "#prompt-message" ).innerHTML;

	// Setup input
	const m_input = document.querySelector( "#input-topic" );
	m_input.addEventListener( "keydown", function ( event ) {
		if( event.key === "Enter" ) {
			event.preventDefault();
			submitTopic();
		}
	} );
	m_input.focus();

	// Setup reset button
	const m_resetButton = document.querySelector( "#reset-btn" );
	m_resetButton.addEventListener( "click", resetPrompt );

	// Setup continue button
	let m_topicName = "";
	let m_topicDescription = "";
	const continueButton = document.querySelector( "#continue-btn" );
	continueButton.addEventListener( "click", selectTopic );

	function submitTopic() {
		const topic = m_input.value.trim();
		if( topic ) {
			m_input.disabled = true;
			showLoadingBars();
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
				document.querySelector( "#prompt-error" ).style.display = "none";

				// Hide the loading bar
				document.querySelector( "#prompt-loading" ).style.display = "none";

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
						e.preventDefault();
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
				document.querySelector( "#prompt-response" ).style.display = "";

				// Hide input
				m_input.style.display = "none";

				// Show reset button
				m_resetButton.style.display = "";
			} )
			.catch( error => {
				console.error( "Error processing topic:", error );

				// Show Error Message
				const promptError = document.querySelector( "#prompt-error" );
				promptError.innerHTML = "Something went wrong.";
				promptError.style.display = "";

				resetPrompt();
			} );
		}
	}

	function resetPrompt() {

		// Hide prompt response
		document.querySelector( "#prompt-response" ).style.display = "none";

		// Hide loading bars
		document.querySelector( "#prompt-loading" ).style.display = "none";

		// Show Prompt message
		const promptMessage = document.querySelector( "#prompt-message" );
		promptMessage.innerHTML = m_promptMessage;
		promptMessage.style.display = "";

		// Reset the input prompt
		m_input.style.display = "";
		m_input.disabled = false;
		m_input.focus();

		// Hide reset button
		m_resetButton.style.display = "none";

		// Hide submit button
		document.querySelector( "#submit-btn" ).style.display = "none";

		// Hide Description
		document.querySelector( "#txt-description-container" ).style.display = "none";
	}

	function selectTopic() {
		
		// Hide the prompt message
		const promptMessage = document.querySelector( "#prompt-message" );
		promptMessage.style.display = "none";
		promptMessage.innerHTML = m_topicName;

		// Hide prompt response
		document.querySelector( "#prompt-response" ).style.display = "none";

		// Load the topic description textarea
		if( m_topicDescription === "" ) {

			// Show the prompt loading bars
			showLoadingBars();

			// Fetch the topic description
			fetch( "/topics/summarize/", {
				"method": "POST",
				"headers": {
					"Content-Type": "application/json",
					"X-CSRFToken": main.getCSRFToken()
				},
				"body": JSON.stringify( { "topic": m_topicName } )
			} )
			.then( response => {
				if( !response.ok ) {
					throw new Error( `Server error: ${response.status}` );
				}
				return response.json();
			} )
			.then( data => {
				
				// Update the description
				m_topicDescription = data.summary;
				showDescription();

			} ).catch( error => {
				console.error( "Error processing description:", error );

				// Show Error Message
				const promptError = document.querySelector( "#prompt-error" );
				promptError.innerHTML = "Something went wrong.";
				promptError.style.display = "";

				resetPrompt();
			} );
		} else {
			showDescription();
		}
	}

	function showDescription() {

		// Hide loading bar
		document.querySelector( "#prompt-loading" ).style.display = "none";

		// Show the prompt message
		document.querySelector( "#prompt-message" ).style.display = "";

		// Update the text area
		document.querySelector( "#txt-description" ).innerHTML = m_topicDescription;
		document.querySelector( "#txt-description-container" ).style.display = "";

		// Show reset button
		m_resetButton.style.display = "";

		// Show submit button
		document.querySelector( "#submit-btn" ).style.display = "";
	}

	function showLoadingBars() {
		document.querySelector( "#prompt-message" ).style.display = "none";
		document.querySelector( "#prompt-response" ).style.display = "none";
		document.querySelector( "#prompt-error" ).style.display = "none";
		document.querySelector( "#submit-btn" ).style.display = "none";
		document.querySelector( "#reset-btn" ).style.display = "none";
		document.querySelector( "#prompt-loading" ).style.display = "";
	}

} )();
