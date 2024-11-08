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
		await processTopic( topicInput.value );
	} );

	saveTopicBtn.addEventListener( "click", async ( e ) => {
		e.preventDefault();
		await saveTopic( topicInput.value, descriptionArea.value );
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

	async function saveTopic( topic, description ) {
		const loadingOverlay = document.getElementById( "loading-overlay" );
		try {
			const data = await main.handleRequest( "/topics/save/", { topic, description } );
			let topicLi = document.querySelector( `[data-topic-id='${data.topic_id}']` );
			let truncated = description.split( " " ).slice( 0, 30 ).join( " " ) + "... ▼";
			let shortStyle = "style='display: none;'";
			let fullStyle = "";
			if( truncated.length < description.length ) {
				shortStyle = "";
				fullStyle = "style='display: none;'";
			}
			if( topicLi ) {
				topicLi.querySelector( ".short" ).innerHTML = truncated;
				topicLi.querySelector( ".full" ).innerHTML = description;
			} else {
				topicLi = document.createElement( "li" );
				topicLi.dataset.topicId = data.topic_id;
				topicLi.innerHTML = `
					<h3>${ topic }</h3>
					<div>
						<p class="short" ${ shortStyle }>${ truncated }</p>
						<p class="full" ${ fullStyle }>${ description }</p>
					</div>
					<button onclick="location.href='/topics/edit/${ data.topic_id }/'">Edit</button>
					<button onclick="location.href='/topics/quiz/${ data.topic_id }/'">Quiz</button>
				`;
				document.querySelector( "#topics-list" ).appendChild( topicLi );
			}
		} catch ( error ) {
			console.error( "Error:", error );
		} finally {
			loadingOverlay.style.visibility = "hidden";
		}
	}

} );
