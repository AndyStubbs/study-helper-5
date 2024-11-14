// static/js/topics_generator.js
"use strict";

/* global window.main */

window.main.onReady( () => {

	const form = document.getElementById( "topic-form" );
	const topicInput = document.getElementById( "topic-input" );
	const submitBtn = document.getElementById( "submit-btn" );
	const resultArea = document.getElementById( "result-area" );
	const descriptionArea = document.getElementById( "description" );
	const suggestionsList = document.getElementById( "suggestions" );
	const saveTopicBtn = document.getElementById( "save-topic-btn" );
	let m_topicId = -1;

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
			updateTopicDetails( data );
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

	async function summarizeTopic( topic_name ) {
		const loadingOverlay = document.getElementById( "loading-overlay" );
		try {
			loadingOverlay.style.visibility = "visible";
			const data = await main.handleRequest( "/topics/summarize/", { topic_name } );
			setTopicId( -1 );
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

	function updateTopicDetails( data ) {

		// Show the results
		resultArea.style.display = "block";
		submitBtn.textContent = "Update";

		// Update description
		if( data.description ) {
			descriptionArea.value = data.description;
		}

		// Set the topic id
		if( data.topic_id ) {
			setTopicId( data.topic_id );
		} else {
			setTopicId( -1 );
		}

		// Update topic name
		if( data.topic_name ) {
			document.getElementById( "topic-input" ).value = data.topic_name;
		}
		
		// Update the suggestions
		const getSuggestionsBtn = document.querySelector( ".sug-btn" );
		suggestionsList.innerHTML = "";
		if( data.suggestions && data.suggestions.length > 0 ) {
			getSuggestionsBtn.style.display = "none";
			getSuggestionsBtn.disabled = true;

			// Loop through the suggestions
			data.suggestions.forEach( suggestion => {
				const li = document.createElement( "li" );
				li.textContent = suggestion;

				// On suggestion clicked
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
		} else {
			getSuggestionsBtn.style.display = "";
			getSuggestionsBtn.disabled = false;
		}
	}

	function setTopicId( topicId ) {
		const deleteButton = document.getElementById( "delete-topic-btn" );
		const viewButton = document.getElementById( "view-topic-btn" );
		if( typeof topicId === "string" ) {
			topicId = parseInt( topicId );
		}
		if( topicId !== -1 ) {
			m_topicId = topicId;
			deleteButton.style.display = "";
			deleteButton.disabled = false;
			viewButton.style.display = "";
			viewButton.disabled = false;
		} else {
			m_topicId = -1;
			deleteButton.style.display = "none";
			deleteButton.disabled = true;
			viewButton.style.display = "none";
			viewButton.disabled = true;
		}
	}

	async function saveTopic( topicName, topicDescription ) {
		const loadingOverlay = document.getElementById( "loading-overlay" );
		try {
			loadingOverlay.style.visibility = "visible";
			const topic = await main.handleRequest( "/topics/save/", {
				"topic_name": topicName,
				"topic_description": topicDescription
			} );
			setTopicId( topic.id );
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
					<button onclick="window.main.editTopic('${ topic.id }')" class="btn-sm btn-c2">Edit</button>
					<button onclick="window.main.quizTopic('${ topic.id }')" class="btn-sm btn-c1">Quiz</button>
				`;
				document.querySelector( "#topics-list" ).appendChild( topicLi );
			}
			const resultMessage = document.querySelector( ".result-message" );
			resultMessage.classList.remove( "result-error" );
			resultMessage.classList.add( "result-success" );
			resultMessage.textContent = "Topic saved successfully!";
			window.main.loadHistory();
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

	// Edit topic function
	window.main.editTopic = ( topicId ) => {

		m_topicId = topicId;

		const topicLi = document.querySelector( `[data-topic-id="${m_topicId}"]` );
		const topicName = topicLi.querySelector( "h3" ).textContent;
		const topicDescription = topicLi.querySelector( ".full" ).textContent;

		// Select the generator tab
		main.selectTab( "generator" );

		// Update the results
		updateTopicDetails( {
			"topic_id": m_topicId,
			"topic_name": topicName,
			"description": topicDescription,
		} );
	};

	// Generate Button
	document.getElementById( "generate-suggestions" ).addEventListener( "click", async () => {
		const loadingOverlay = document.getElementById( "loading-overlay" );
		const topic_name = document.getElementById( "topic-input" ).value;
		loadingOverlay.style.visibility = "visible";
		try {
			const data = await main.handleRequest( "/topics/suggest/", { topic_name } );
			data.topic_id = m_topicId;
			updateTopicDetails( data );
		} catch( error ) {
			console.error( "Error:", error );
			const resultMessage = document.querySelector( ".result-message" );
			resultMessage.classList.remove( "result-success" );
			resultMessage.classList.add( "result-error" );
			resultMessage.textContent = error;
		} finally {
			loadingOverlay.style.visibility = "hidden";
		}
	} );

	// Delete Button
	document.getElementById( "delete-topic-btn" ).addEventListener( "click", async () => {

		const isConfirmed = await window.main.confirm(
			"Are you sure you wish to delete this topic?"
		);

		if( !isConfirmed ) {
			return;
		}
		const loadingOverlay = document.getElementById( "loading-overlay" );
		const topic_id = m_topicId;
		if( topic_id === -1 ) {
			throw "Topic id is not valid!";
		}
		loadingOverlay.style.visibility = "visible";
		try {
			await main.handleRequest( "/topics/delete/", { topic_id } );
			resultArea.style.display = "none";
			const topicLi = document.querySelector( `[data-topic-id="${m_topicId}"]` );
			topicLi.remove();
			document.getElementById( "topic-input" ).value = "";
			document.getElementById( "description" ).value = "";
			window.main.loadHistory();
		} catch( error ) {
			console.error( "Error:", error );
			const resultMessage = document.querySelector( ".result-message" );
			resultMessage.classList.remove( "result-success" );
			resultMessage.classList.add( "result-error" );
			resultMessage.textContent = error;
		} finally {
			loadingOverlay.style.visibility = "hidden";
		}
	} );

	// View the topic
	document.getElementById( "view-topic-btn" ).addEventListener( "click", async () => {
		main.selectTab( "topics" );
		const topicLi = document.querySelector( `[data-topic-id="${m_topicId}"]` );
		if( topicLi.style.display === "none" ) {
			document.getElementById( "search-box" ).value = "";
			window.main.filter();
		}
		window.requestAnimationFrame( () => {
			topicLi.scrollIntoView( { "behavior": "smooth", "block": "center" } );
		} );
	} );
} );
