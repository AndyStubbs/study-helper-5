// static/js/topics_explain.js

"use strict"

/* global window.main */
/* global window.marked */

window.main.onReady( function () {
	const m_explanationModal = document.getElementById( "explanation-modal" );
	const m_closeExplanationButton = document.getElementById( "close-explanation-button" );
	const m_explanationQuestion = document.getElementById( "explanation-question" );
	const m_explanationAnswer = document.getElementById( "explanation-answer" );
	const m_explanationContent = document.getElementById( "explanation-content" );
	const m_loadingOverlay = m_explanationModal.querySelector( ".loading-overlay" );

	// Show explanation modal and load explanation content
	function updateExplanation( question, answer, explanation ) {
		m_explanationQuestion.style.textAlign = "left";
		m_explanationQuestion.textContent = question;
		m_explanationAnswer.innerHTML = "<strong>Answer: </strong>" + answer;
		m_explanationContent.innerHTML = window.marked.parse( explanation );
	}

	// Hide the explanation modal
	function hideExplanation() {
		m_explanationModal.style.display = "none";
		m_explanationQuestion.textContent = "Loading explanation...";
		m_explanationAnswer.textContent = "";
		m_explanationContent.textContent = "";
	}

	// Initialize syntax highlighting
	window.marked.setOptions( {
		highlight: function ( code ) {
			return hljs.highlightAuto( code ).value;
		}
	} );

	// Attach event listener to "Explain" button in the quiz modal
	window.main.explain = async function( question_id ) {
		m_explanationQuestion.style.textAlign = "center";
		m_explanationModal.style.display = "block";
		m_loadingOverlay.style.visibility = "visible";

		// Fetch explanation data
		try {
			const data = await main.handleRequest(
				"/topics/explain/", { "question_id": question_id }
			);
			updateExplanation( data.question, data.answer, data.explanation );
		} catch( error ) {
			console.error( "Error fetching explanation:", error );
			hideExplanation();
		} finally {
			m_loadingOverlay.style.visibility = "hidden";
		}
	};

	// Close the modal when the close button is clicked
	m_closeExplanationButton.addEventListener( "click", hideExplanation );
	m_explanationModal.querySelector( ".close" ).addEventListener( "click", hideExplanation );
	m_explanationModal.addEventListener( "click", ( e ) => {
		if( e.target === e.currentTarget ) {
			hideExplanation();
		}
	} );
} );
