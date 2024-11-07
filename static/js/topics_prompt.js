// static/js/topic_prompt.js


( function () {
	/* global main */

	const m_input = document.querySelector( "#input-topic" );
	const m_promptMessage = document.querySelector( "#prompt-message" );
	const m_submitButton = document.querySelector( "#submit-btn" );
	const m_resetButton = document.querySelector( "#reset-btn" );
	const m_continueButton = document.querySelector( "#continue-btn" );
	const m_promptResponse = document.querySelector( "#prompt-response" );
	const m_promptError = document.querySelector( "#prompt-error" );
	const m_promptLoading = document.querySelector( "#prompt-loading" );
	const m_textDescriptionContainer = document.querySelector( "#txt-description-container" );
	const m_textDescription = document.querySelector( "#txt-description" );

	// Save original prompt message
	const m_promptMessageText = m_promptMessage.innerHTML;

	// Setup input
	m_input.addEventListener( "keydown", function ( event ) {
		if( event.key === "Enter" ) {
			event.preventDefault();
			submitTopic();
		}
	} );
	m_input.focus();

	// Setup reset button
	m_resetButton.addEventListener( "click", resetPrompt );

	// Setup continue button
	let m_topicName = "";
	let m_topicDescription = "";
	m_continueButton.addEventListener( "click", selectTopic );

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
				m_promptError.style.display = "none";

				// Hide the loading bar
				m_promptLoading.style.display = "none";

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
				m_promptResponse.style.display = "";

				// Enable continue button
				m_continueButton.disabled = false;

				// Hide input
				m_input.style.display = "none";

				// Show reset button
				m_resetButton.style.display = "";
				m_resetButton.disabled = false;
			} )
			.catch( error => {
				console.error( "Error processing topic:", error );

				// Show Error Message
				m_promptError.innerHTML = "Something went wrong.";
				m_promptError.style.display = "";

				resetPrompt();
			} );
		}
	}

	function resetPrompt() {

		// Hide prompt response
		m_promptResponse.style.display = "none";

		// Disable continue button
		m_continueButton.disabled = true;

		// Hide loading bars
		m_promptLoading.style.display = "none";

		// Show Prompt message
		m_promptMessage.innerHTML = m_promptMessageText;
		m_promptMessage.style.display = "";

		// Reset the input prompt
		m_input.style.display = "";
		m_input.disabled = false;
		m_input.focus();

		// Hide reset button
		m_resetButton.style.display = "none";
		m_resetButton.disabled = true;

		// Hide submit button
		m_submitButton.style.display = "none";
		m_submitButton.disabled = true;

		// Hide Description
		m_textDescriptionContainer.style.display = "none";
	}

	function selectTopic() {
		
		// Hide the prompt message
		m_promptMessage.style.display = "none";
		m_promptMessage.innerHTML = m_topicName;

		// Hide prompt response
		m_promptResponse.style.display = "none";

		// Diable continue button
		m_continueButton.disabled = true;

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
				m_promptError.innerHTML = "Something went wrong.";
				m_promptError.style.display = "";

				resetPrompt();
			} );
		} else {
			showDescription();
		}
	}

	function showDescription() {

		// Hide loading bar
		m_promptLoading.style.display = "none";

		// Show the prompt message
		m_promptMessage.style.display = "";

		// Update the text area
		m_textDescription.innerHTML = m_topicDescription;
		m_textDescriptionContainer.style.display = "";

		// Show reset button
		m_resetButton.style.display = "";
		m_resetButton.disabled = false;

		// Show submit button
		m_submitButton.style.display = "";
		m_submitButton.disabled = false;
	}

	function showLoadingBars() {
		m_promptMessage.style.display = "none";
		m_promptResponse.style.display = "none";
		m_continueButton.disabled = true;
		m_promptError.style.display = "none";
		m_submitButton.style.display = "none";
		m_submitButton.disabled = true;
		m_resetButton.style.display = "none";
		m_resetButton.disabled = true;
		m_promptLoading.style.display = "";
	}

} )();
