// static/js/topics_quiz.js
"use strict";

/* global window.main */

window.main.onReady( function () {

	window.main.quizTopic = openQuizModal;

	const m_quizModal = document.getElementById( "quiz-modal" );
	const m_closeModal = document.querySelector( ".close" );
	const m_questionElement = document.getElementById("quiz-question" );
	const m_answerButtons = document.querySelectorAll( "#quiz-answers button" );
	const m_skipButton = document.getElementById( "skip-button" );
	const m_explainButton = document.getElementById( "explain-button" );

	let m_topicId = -1;
	let m_questionId = -1;
	let m_correctAnswer = "";

	// Close modal event
	m_closeModal.addEventListener( "click", () => {
		m_quizModal.style.display = "none";
	} );

	// Close modal when clicking off modal
	m_quizModal.addEventListener( "click", ( e ) => {
		if( e.target === e.currentTarget ) {
			m_quizModal.style.display = "none";
		}
	} );

	// Add button click events
	m_answerButtons.forEach( ( button ) => {
		button.addEventListener( "click", () => {
			submitAnswer( button.textContent );
		} );
	} );

	// Skip button logic
	m_skipButton.addEventListener( "click", async () => {
		await submitAnswer( "" );
		loadNextQuestion();
	} );

	// Explain button
	m_explainButton.addEventListener( "click", () => {
		window.main.explain( m_questionId );
	} );

	// Function to open the quiz modal and load the next question
	function openQuizModal( topicId ) {
		m_topicId = parseInt( topicId );
		m_quizModal.style.display = "block";
		loadNextQuestion();
	}

	// Function to load the next quiz question from the server
	async function loadNextQuestion() {
		// Reset to empty question
		m_quizModal.querySelector( ".loading-overlay" ).style.visibility = "visible";
		m_questionElement.textContent = "Loading question...";
		document.getElementById( "quiz-result" ).innerHTML = "&nbsp;";
		m_skipButton.textContent = "Skip";
		m_explainButton.style.display = "none";
		m_answerButtons.forEach( button => {
			button.textContent = "...";
			button.style.fontSize = "18px";
			button.style.fontWeight = "bold";
			button.classList.remove( "long" );
			button.classList.remove( "correct" );
			button.classList.remove( "wrong" );
			button.disabled = true;
		} );
		m_questionId = -1;
		m_correctAnswer = "";

		try {
			const data = await main.handleRequest( "/topics/question/", { "topic_id": m_topicId } );

			// Shuffle the answers
			const answers = [];
			while( data.answers.length > 0 ) {
				const i = Math.floor( Math.random() * data.answers.length );
				const answer = data.answers[ i ];
				data.answers.splice( i, 1 );
				answers.push( answer );
			}
			m_questionId = data.id;
			m_questionElement.textContent = data.text;
			let maxLength = 0;

			m_answerButtons.forEach( ( button, index ) => {
				button.style.fontSize = "";
				button.style.fontWeight = "";
				button.textContent = answers[ index ] || "";
				button.classList.remove( "long" );
				let len = answers[ index ].length;
				if( len > maxLength ) {
					maxLength = len;
				}
				button.disabled = false;
			} );
			if( maxLength > 40 ) {
				m_answerButtons.forEach( button => {
					button.classList.add( "long" );
				} );
			}
		} catch ( error ) {
			console.error( "Error loading quiz:", error );
			m_questionElement.textContent = "Error loading quiz.";
			m_answerButtons.forEach( button => {
				button.textContent = "N/A";
			} );
		} finally {
			m_quizModal.querySelector( ".loading-overlay" ).style.visibility = "hidden";
		}
	}

	// Submit answer
	async function submitAnswer( answer ) {
		if( m_questionId !== -1 && m_correctAnswer === "" ) {
			const data = await main.handleRequest(
				"/topics/answer/", { "question_id": m_questionId, "answer": answer }
			);
			m_correctAnswer = data.answer;
			m_answerButtons.forEach( button => {
				if( data.answer === button.textContent ) {
					button.classList.add( "correct" );
				} else if ( button.textContent === answer ) {
					button.classList.add( "wrong" );
				}
				button.disabled = true;
			} );

			// Update result text
			const quizResult = document.getElementById( "quiz-result" );
			if( data.answer === answer ) {
				quizResult.textContent = "Correct!";
				quizResult.classList.add( "result-success" );
				quizResult.classList.remove( "result-error" );
			} else {
				quizResult.textContent = "Wrong";
				quizResult.classList.remove( "result-success" );
				quizResult.classList.add( "result-error" );
			}

			m_skipButton.textContent = "Next";
			m_explainButton.style.display = "";
		}
	}

} );
