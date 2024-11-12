// static/js/topics_quiz.js

/* global window.main */

window.main.onReady( function () {

	window.main.quizTopic = openQuizModal;

	const quizModal = document.getElementById( "quiz-modal" );
	const closeModal = document.querySelector( ".close" );
	const questionElement = document.getElementById("quiz-question" );
	const answerButtons = document.querySelectorAll( "#quiz-answers button" );
	const skipButton = document.getElementById( "skip-button" );

	let m_topicId = -1;
	let m_questionId = -1;
	let m_firstGuess = "";

	// Close modal event
	closeModal.addEventListener( "click", () => {
		quizModal.style.display = "none";
	} );

	// Function to open the quiz modal and load the next question
	function openQuizModal( topicId ) {
		m_topicId = topicId;
		quizModal.style.display = "block";
		loadNextQuestion();
	}

	// Function to load the next quiz question from the server
	async function loadNextQuestion() {

		// Reset to empty question
		quizModal.querySelector( ".loading-overlay" ).style.visibility = "visible";
		questionElement.textContent = "Loading question...";
		answerButtons.forEach( button => {
			button.textContent = "...";
			button.onclick = null;
			button.style.fontSize = "18px";
			button.style.fontWeight = "bold";
			button.classList.remove( "long" );
		} );
		m_questionId = -1;

		try {
			const data = await main.handleRequest( "/topics/question/", { "topic_id": m_topicId } );
			m_firstGuess = "";
			m_questionId = data.id;
			questionElement.textContent = data.text;
			let maxLength = 0;
			answerButtons.forEach( ( button, index ) => {
				button.style.fontSize = "";
				button.style.fontWeight = "";
				button.textContent = data.answers[ index ] || "";
				button.classList.remove( "long" );
				let len = data.answers[ index ].length;
				if( len > maxLength ) {
					maxLength = len;
				}
				button.onclick = () => {
					if( m_firstGuess === "" ) {
						m_firstGuess = button.textContent;
					}
					if( button.textContent === data.correct ) {
						main.alert( "Correct" );
						submitAnswer();
						loadNextQuestion();
					} else {
						main.alert( "Incorrect" );
					}
				};
			} );
			if( maxLength > 40 ) {
				answerButtons.forEach( button => {
					button.classList.add( "long" );
				} );
			}
		} catch ( error ) {
			console.error( "Error loading quiz:", error );
			questionElement.textContent = "Error loading quiz.";
			answerButtons.forEach( button => {
				button.textContent = "N/A";
				button.onclick = null;
			} );
		} finally {
			quizModal.querySelector( ".loading-overlay" ).style.visibility = "hidden";
		}
	}

	// Submit answer
	function submitAnswer() {
		if( m_questionId !== -1 ) {
			main.handleRequest(
				"/topics/answer/", { "question_id": m_questionId, "answer": m_firstGuess }
			);
		}
	}

	// Skip button logic
	skipButton.addEventListener( "click", () => {
		submitAnswer();
		loadNextQuestion();
	} );
} );
