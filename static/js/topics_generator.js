// static/js/topics_generator.js
"use strict";

/* global window.main */

window.main.onReady( () => {

	const m_form = document.getElementById( "topic-form" );
	const m_topicInput = document.getElementById( "topic-input" );
	const m_submitBtn = document.getElementById( "submit-btn" );
	const m_resultArea = document.getElementById( "result-area" );
	const m_descriptionArea = document.getElementById( "description" );
	const m_suggestionsList = document.getElementById( "suggestions" );
	const m_saveTopicBtn = document.getElementById( "save-topic-btn" );
	const m_attachDocumentsBtn = document.getElementById( "attach-documents" );
	const m_topicSettingsBtn = document.getElementById( "topic-settings-btn" );

	let m_topicId = -1;

	m_form.addEventListener( "submit", async ( e ) => {
		e.preventDefault();
		await evaluateTopic( m_topicInput.value );
	} );

	m_saveTopicBtn.addEventListener( "click", async ( e ) => {
		e.preventDefault();
		await saveTopic( m_topicInput.value, m_descriptionArea.value );
	} );

	m_attachDocumentsBtn.addEventListener( "click", () => {
		window.main.selectDocuments( m_topicId );
	} );

	m_topicSettingsBtn.addEventListener( "click", () => {
		window.main.topicSettings( m_topicId );
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
			m_descriptionArea.value = data.description;
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
		m_resultArea.style.display = "block";
		m_submitBtn.textContent = "Update";

		// Update description
		if( data.description ) {
			m_descriptionArea.value = data.description;
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
		m_suggestionsList.innerHTML = "";
		if( data.suggestions && data.suggestions.length > 0 ) {
			getSuggestionsBtn.style.display = "none";
			getSuggestionsBtn.disabled = true;

			// Loop through the suggestions
			data.suggestions.forEach( suggestion => {
				const li = document.createElement( "li" );
				li.textContent = suggestion;

				// On suggestion clicked
				li.addEventListener( "click", () => {
					m_topicInput.value = suggestion;
					m_suggestionsList.querySelectorAll( ".selected" ). forEach( selected_li => {
						selected_li.classList.remove( "selected" );
					} );
					li.classList.add( "selected" );
					summarizeTopic( suggestion );
				} );
				m_suggestionsList.appendChild( li );
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

	function createTopicListItem( topic ) {
		const topicLi = document.createElement( "li" );
		const escape = window.main.escape;
		topicLi.classList.add( "topic-item" );
		topicLi.dataset.topicId = topic.id;
		topicLi.innerHTML = `
			<h3>${ escape( topic.name ) }<span class="arrow">▼</span></h3>
			<div>
				<p class="short">${ escape( topic.description ) }</p>
			</div>
			<div>
				<button onclick="window.main.editTopic('${ topic.id }')" class="btn-sm btn-c2">
					Edit
				</button>
				<button onclick="window.main.quizTopic('${ topic.id }')" class="btn-sm btn-c1">
					Quiz
				</button>
			</div>
		`;
		
		// Insert topic alphabetically
		const topicsList = document.getElementById( "topics-list" );
		const topicItemsList = topicsList.querySelectorAll( "h3" );
		if( topicItemsList.length > 0 ) {
			let isInserted = false;
			for( let i = 0; i < topicItemsList.length; i += 1 ) {
				const topicHeader = topicItemsList[ i ];
				if( topicHeader.textContent > topic.name ) {
					topicsList.insertBefore( topicLi, topicHeader.closest( "li" ) );
					isInserted = true;
					break;
				}
			}
			if( !isInserted ) {
				topicsList.appendChild( topicLi );
			}
		} else {
			topicsList.appendChild( topicLi );
		}
	}
	
	// Save topic function
	async function saveTopic( topicName, topicDescription ) {
		const loadingOverlay = document.getElementById( "loading-overlay" );
		const topicData = {
			"settings": window.main.getTopicSettings(),
			"attachments": window.main.getTopicAttachments()
		};
		try {
			loadingOverlay.style.visibility = "visible";
			const escape = window.main.escape;
			const topic = await main.handleRequest( "/topics/save/", {
				"topic_name": topicName,
				"topic_description": topicDescription,
				"topic_data": topicData
			} );
			setTopicId( topic.id );
			let topicLi = document.querySelector( `[data-topic-id='${topic.id}']` );
			if( topicLi ) {
				topicLi.querySelector( ".short" ).innerHTML = escape( topic.description );
			} else {
				createTopicListItem( topic );
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
		let topicName = topicLi.querySelector( "h3" ).textContent;
		const topicDescription = topicLi.querySelector( "p" ).textContent;

		topicName = topicName.replace( "▼", "" ).replace( "▲", "" );

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
			m_resultArea.style.display = "none";
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

	// Get all the topics
	window.main.onLoggedIn( async () => {
		const topics = await window.main.handleRequest( "/topics/getalltopics/" );
		topics.forEach( topic => {
			createTopicListItem( topic );
		} );
	} );
} );
