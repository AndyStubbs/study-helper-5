// static/js/topics_quiz.js
"use strict";

/* global window.main */

window.main.onReady( function () {

	window.main.quizTopic = openQuizModal;
	window.main.quizQuestion = openQuestionModal;

	const m_quizModal = document.getElementById( "quiz-modal" );
	const m_closeModal = document.querySelector( ".close" );
	const m_questionElement = document.getElementById( "quiz-question" );
	const m_openAnswerTextarea = document.getElementById( "quiz-open-answer" );
	const m_answersContainer = document.getElementById( "quiz-answers" );
	const m_answerButtons = document.querySelectorAll( "#quiz-answers button" );
	const m_submitAnswerBtn = document.getElementById( "quiz-submit-btn" );
	const m_skipBtn = document.getElementById( "quiz-skip-btn" );
	const m_explainBtn = document.getElementById( "quiz-explain-btn" );
	const m_quizResetBtn = document.getElementById( "quiz-reset-btn" );
	const m_quizResults = document.getElementById( "quiz-result" );

	let m_topicId = -1;
	let m_questionId = -1;
	let m_correctAnswer = "";
	let m_data = {
		"isOpen": false,
		"question": "",
		"answer": "",
		"explanation": "",
		"isCorrect": undefined,
		"questionData": undefined
	};
	let m_state = {
		"isLoadingQuestion": false,
		"isOpen": false,
		"isAnswered": false
	};

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

	// Submit button login
	m_submitAnswerBtn.addEventListener( "click", async () => {
		const answer = m_openAnswerTextarea.value;
		if( answer === "" ) {
			window.main.alert( "Please enter an answer or hit the skip button." );
			return;
		}
		await submitAnswer( answer );
	} );

	// Skip button logic
	m_skipBtn.addEventListener( "click", async () => {
		await submitAnswer( "" );
		loadNextQuestion();
	} );

	// Explain button
	m_explainBtn.addEventListener( "click", () => {
		if( m_data[ "isOpen" ] ) {
			window.main.explainOpen( m_data );
		} else {
			window.main.explain( m_questionId );
		}
	} );

	// Reset the quiz
	m_quizResetBtn.addEventListener( "click", () => {
		setupQuestion( m_data[ "questionData" ] );
	} );

	// Function to open the quiz modal and load the next question
	function openQuizModal( topicId ) {
		m_topicId = parseInt( topicId );
		m_quizModal.style.display = "block";
		loadNextQuestion();
	}

	function openQuestionModal( questionId, topicId ) {
		m_topicId = parseInt( topicId );
		m_quizModal.style.display = "block";
		loadQuestion( questionId );
	}

	function updateUI() {
		if( m_state[ "isLoadingQuestion" ] ) {
			m_skipBtn.textContent = "Skip";
			m_explainBtn.style.display = "none";
			m_submitAnswerBtn.style.display = "none";
			m_quizResetBtn.style.display = "none";
			m_answersContainer.style.display = "";
			m_openAnswerTextarea.style.display = "none";
			m_answerButtons.forEach( button => {
				button.textContent = "...";
				button.style.fontSize = "18px";
				button.style.fontWeight = "bold";
				button.classList.remove( "long" );
				button.classList.remove( "correct" );
				button.classList.remove( "wrong" );
				button.disabled = true;
			} );
			m_quizResults.innerHTML = "&nbsp;";
			m_quizResults.classList.remove( "result-success" );
			m_quizResults.classList.remove( "result-error" );
			return;
		}
		if( m_state[ "isOpen" ] ) {
			m_answersContainer.style.display = "none";
			m_openAnswerTextarea.style.display = "";
			if( m_state[ "isAnswered" ] ) {
				m_submitAnswerBtn.style.display = "none";
				m_skipBtn.style.display = "";
				m_explainBtn.style.display = "";
				m_quizResetBtn.style.display = "";
				m_explainBtn.textContent = "See Details";
				m_skipBtn.textContent = "Next";
				m_openAnswerTextarea.disabled = true;
			} else {
				m_submitAnswerBtn.style.display = "";
				m_skipBtn.style.display = "";
				m_explainBtn.style.display = "none";
				m_quizResetBtn.style.display = "none";
				m_skipBtn.textContent = "Skip";
				m_quizResults.innerHTML = "&nbsp;";
				m_openAnswerTextarea.disabled = false;
			}
		} else {
			m_answersContainer.style.display = "";
			m_openAnswerTextarea.style.display = "none";
			m_quizResetBtn.style.display = "none";
			if( m_state[ "isAnswered" ] ) {
				m_submitAnswerBtn.style.display = "none";
				m_skipBtn.style.display = "";
				m_explainBtn.style.display = "";
				m_explainBtn.textContent = "Explain";
				m_skipBtn.textContent = "Next";
			} else {
				m_submitAnswerBtn.style.display = "none";
				m_skipBtn.style.display = "";
				m_explainBtn.style.display = "none";
				m_skipBtn.textContent = "Skip";
				m_quizResults.innerHTML = "&nbsp;";
			}
		}
	}

	async function loadQuestion( questionId ) {
		setQuestionLoadingState();
		try {
			toggleLoadingOverlay( false );
			const data = await main.handleRequest(
				"/topics/question2/",
				{ "question_id": questionId }
			);
			setupQuestion( data );
		} catch ( error ) {
			console.error( "Error loading quiz:", error );
			m_questionElement.textContent = "Error loading quiz.";
			m_answerButtons.forEach( button => {
				button.textContent = "N/A";
			} );
		} finally {
			toggleLoadingOverlay( true );
		}
	}

	// Function to load the next quiz question from the server
	async function loadNextQuestion() {
		setQuestionLoadingState();
		try {
			toggleLoadingOverlay( false );
			const data = await main.handleRequest( "/topics/question/", { "topic_id": m_topicId } );
			setupQuestion( data );
		} catch ( error ) {
			console.error( "Error loading quiz:", error );
			m_questionElement.textContent = "Error loading quiz.";
			m_answerButtons.forEach( button => {
				button.textContent = "N/A";
			} );
		} finally {
			toggleLoadingOverlay( true );
		}
	}

	// Submit answer
	async function submitAnswer( answer ) {
		if( m_questionId !== -1 && m_correctAnswer === "" ) {
			try {

				// Show loading overlay
				toggleLoadingOverlay( false );

				// Submit answer to server
				const data = await main.handleRequest(
					"/topics/answer/", { "question_id": m_questionId, "answer": answer }
				);
				
				// Update state and data
				m_state[ "isAnswered" ] = true;
				updateUI();

				// Update button status
				if( !data.is_open ) {
					m_correctAnswer = data.answer;
					m_answerButtons.forEach( button => {
						if( data.correct === button.textContent ) {
							button.classList.add( "correct" );
						} else if ( button.textContent === answer ) {
							button.classList.add( "wrong" );
						}
						button.disabled = true;
					} );
				}

				// Update result text
				if( data.is_correct ) {
					m_quizResults.textContent = "Correct!";
					m_quizResults.classList.add( "result-success" );
					m_quizResults.classList.remove( "result-error" );
				} else {
					m_quizResults.textContent = "Wrong";
					m_quizResults.classList.remove( "result-success" );
					m_quizResults.classList.add( "result-error" );
				}

				// Update answer data
				m_data[ "answer" ] = answer;
				m_data[ "isCorrect" ] = data.is_correct;
				m_data[ "isOpen" ] = data.is_open;

				if( data.is_open ) {
					m_data[ "explanation" ] = data.correct;
				} else {
					m_data[ "explanation" ] = "";
				}

				// Update the history data
				window.main.loadHistory();
			} catch ( error ) {
				console.error( "Error answering question:", error );
				m_questionElement.textContent = "Error answering question.";
				m_answerButtons.forEach( button => {
					button.textContent = "N/A";
				} );
			} finally {
				toggleLoadingOverlay( true );
			}
		}
	}

	// Reset to empty question
	function setQuestionLoadingState() {
		m_data = {
			"isOpen": false,
			"question": "",
			"answer": "",
			"explanation": "",
			"isCorrect": undefined,
			"questionData": undefined
		};
		m_questionElement.textContent = "Loading question...";
		m_state[ "isLoadingQuestion" ] = true;
		updateUI();
		m_questionId = -1;
		m_correctAnswer = "";
	}

	function setupQuestion( data ) {

		// Update state
		m_state[ "isLoadingQuestion" ] = false;
		m_state[ "isAnswered" ] = false;
		m_state[ "isOpen" ] = data.is_open;
		updateUI();

		m_data[ "questionData" ] = data;
		const answers = [];
		if( data.is_open ) {
			m_openAnswerTextarea.innerHTML = data.boilerplate;
		} else {
			// Shuffle the answers
			while( data.answers.length > 0 ) {
				const i = Math.floor( Math.random() * data.answers.length );
				const answer = data.answers[ i ];
				data.answers.splice( i, 1 );
				answers.push( answer );
			}
		}
		m_questionId = data.id;
		m_questionElement.textContent = data.text;
		m_data[ "question" ] = data.text;
		let maxLength = 0;
		m_answerButtons.forEach( ( button, index ) => {
			if( index >= answers.length ) {
				return;
			}
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
	}

	function toggleLoadingOverlay( isHidden ) {
		const loadingOverlay = m_quizModal.querySelector( ".loading-overlay" );
		if( isHidden ) {
			loadingOverlay.style.visibility = "hidden";
		} else {
			loadingOverlay.style.visibility = "visible";
		}
	}
} );
