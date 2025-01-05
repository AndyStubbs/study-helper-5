// static/js/topics_quiz.js
"use strict";

/* global window.main */

window.main.onReady( function () {
	const DELAY = 500;

	window.main.quizTopic = openQuizModal;
	window.main.quizQuestion = openQuestionModal;

	const m_quizModal = document.getElementById( "quiz-modal" );
	const m_closeModal = document.querySelector( ".close" );
	const m_questionText = document.getElementById( "quiz-question" );
	const m_questionDetails = document.getElementById( "quiz-details" );
	const m_openAnswerTextarea = document.getElementById( "quiz-open-answer" );
	const m_answersContainer = document.getElementById( "quiz-answers" );
	const m_answerButtons = document.querySelectorAll( "#quiz-answers button" );
	const m_submitAnswerBtn = document.getElementById( "quiz-submit-btn" );
	const m_skipBtn = document.getElementById( "quiz-skip-btn" );
	const m_explainBtn = document.getElementById( "quiz-explain-btn" );
	const m_quizResetBtn = document.getElementById( "quiz-reset-btn" );
	const m_quizResults = document.getElementById( "quiz-result" );
	const m_quizEditor = document.getElementById( "quiz-editor" );
	const m_quizEditorCode = document.getElementById( "quiz-editor-code" );
	const m_quizEditorText = document.getElementById( "quiz-editor-text" );

	let m_topicId = -1;
	let m_questionId = -1;
	let m_data = {
		"isOpen": false,
		"question": "",
		"answer": "",
		"explanation": "",
		"isCorrect": undefined,
		"questionData": undefined,
		"languageClass": "plaintext",
		"maxWidth": 600
	};
	let m_state = {
		"isLoadingQuestion": false,
		"isOpen": false,
		"isCode": false,
		"isAnswered": false
	};
	let m_score = {
		"correct": 0,
		"total": 0
	};

	// Close modal event
	m_closeModal.addEventListener( "click", () => {
		window.main.closeModal( m_quizModal );
	} );

	// Close modal when clicking off modal
	m_quizModal.addEventListener( "click", ( e ) => {
		if( e.target === e.currentTarget ) {
			window.main.closeModal( m_quizModal );
		}
	} );

	// Add button click events
	m_answerButtons.forEach( ( button ) => {
		button.addEventListener( "click", () => {
			submitAnswer( button.textContent );
		} );
	} );

	// Submit answer button
	m_submitAnswerBtn.addEventListener( "click", async () => {
		let answer;
		if( m_state.isCode ) {
			answer = m_quizEditorText.textContent;
		} else {
			answer = m_openAnswerTextarea.value;
		}
		if( answer === "" ) {
			window.main.alert( "Please enter an answer or hit the skip button." );
			return;
		}
		await submitAnswer( answer );
	} );

	// Skip button logic
	m_skipBtn.addEventListener( "click", async () => {

		// If question is already answered no need to skip answer
		if( !m_state.isAnswered ) {

			// Skips the answer by submitting an empty string
			await submitAnswer( "" );
		}

		// Load the next question
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

	// Allow tabs for textareas
	m_openAnswerTextarea.addEventListener( "keydown", allowTabs );
	m_quizEditorText.addEventListener( "keydown", allowTabs );

	// Handle input for the text editor
	m_quizEditorText.addEventListener( "input", e => {
		e.preventDefault();
		syncHighlighting();
	} );

	// Attach scroll event listeners to synchronize scrolling
	m_quizEditorText.addEventListener( "scroll", syncScroll );
	m_quizEditorText.addEventListener( "paste", sanitizePaste );
	m_quizEditorCode.addEventListener( "scroll", syncScroll );

	// Handle past of text editor
	function sanitizePaste( e ) {

		// Prevent the default paste behavior
		e.preventDefault();
	
		// Get the clipboard text data
		const clipboardData = ( e.clipboardData || window.clipboardData ).getData( "text/plain" );
	
		// Sanitize the pasted content to plain text
		const sanitizedContent = clipboardData.replace( /\r?\n/g, "\n" );
	
		// Insert the sanitized content at the caret position
		const selection = window.getSelection();
		const range = selection.getRangeAt( 0 );
	
		// Create a text node for the pasted content
		const textNode = document.createTextNode( sanitizedContent );
	
		// Insert the text node into the contenteditable
		range.deleteContents();
		range.insertNode( textNode );
	
		// Move the caret to the end of the inserted content
		range.setStartAfter( textNode );
		range.setEndAfter( textNode );
	
		// Apply the updated range
		selection.removeAllRanges();
		selection.addRange( range );

		syncHighlighting();
	}

	// Synchronize scrollbars for the editor and code preview
	function syncScroll( event ) {
		const source = event.target;

		// Determine the target
		let target;
		if( source === m_quizEditorText ) {
			target = m_quizEditorCode;
		} else {
			target = m_quizEditorText;
		}

		// Synchronize the scroll positions
		target.scrollTop = source.scrollTop;
		target.scrollLeft = source.scrollLeft;
	}

	// Allow tabs for text areas
	function allowTabs( e ) {
		if( e.key === "Tab" ) {
			e.preventDefault();
			const element = e.target;
			if( element.tagName.toLowerCase() === "div" ) {
				const selection = window.getSelection();
				const range = selection.getRangeAt( 0 );
				const tabNode = document.createTextNode( "\t" );
				range.insertNode( tabNode );
				range.setStartAfter( tabNode );
				range.setEndAfter( tabNode );
				selection.removeAllRanges();
				selection.addRange( range );
				syncHighlighting();
			} else {
				const start = element.selectionStart;
				const end = element.selectionEnd;
				element.value = element.value.substring( 0, start ) + "\t" +
				element.value.substring( end );
				element.selectionStart = element.selectionEnd = start + 1;
			}
		}
	}
	
	// Add syntax higlighting for code editor
	function syncHighlighting() {
		if( !m_state.isCode ) {
			return;
		}
		const code = m_quizEditorText.textContent;
		let language = m_data.languageClass.replace( "language-", "" );
		if( !hljs.getLanguage( language ) ) {
			console.error( `Invalid language: ${language} - using plaintext` );
			language = "plaintext";
		}
		const highlighted = hljs.highlight( code, { language: language } ).value;
		m_quizEditorCode.innerHTML = highlighted;
	}

	// Function to open the quiz modal and load the next question
	function openQuizModal( topicId ) {
		resetScore();
		m_topicId = parseInt( topicId );
		window.main.openModal( m_quizModal );
		loadNextQuestion();
	}

	function openQuestionModal( questionId, topicId ) {
		resetScore();
		m_topicId = parseInt( topicId );
		window.main.closeModal( m_quizModal );
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
			m_quizEditor.style.display = "none";
			m_quizModal.querySelector( ".modal" ).style.maxWidth = "600px";
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
			m_quizEditor.classList.remove( "quiz-correct" );
			m_quizEditor.classList.remove( "quiz-wrong" );
			m_openAnswerTextarea.classList.remove( "quiz-correct" );
			m_openAnswerTextarea.classList.remove( "quiz-wrong" );
			return;
		}
		if( m_state[ "isOpen" ] ) {
			m_answersContainer.style.display = "none";
			m_openAnswerTextarea.style.display = "";
			m_quizEditor.style.display = "none";
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
				m_openAnswerTextarea.classList.remove( "quiz-correct" );
				m_openAnswerTextarea.classList.remove( "quiz-wrong" );
			}
		} else if( m_state[ "isCode" ] ) {
			m_answersContainer.style.display = "none";
			m_openAnswerTextarea.style.display = "none";
			m_quizEditor.style.display = "";
			if( m_state[ "isAnswered" ] ) {
				m_submitAnswerBtn.style.display = "none";
				m_skipBtn.style.display = "";
				m_explainBtn.style.display = "";
				m_quizResetBtn.style.display = "";
				m_explainBtn.textContent = "See Details";
				m_skipBtn.textContent = "Next";
				m_quizEditorText.contentEditable = false;
				m_quizEditor.classList.add( "disabled" );
			} else {
				m_submitAnswerBtn.style.display = "";
				m_skipBtn.style.display = "";
				m_explainBtn.style.display = "none";
				m_quizResetBtn.style.display = "none";
				m_skipBtn.textContent = "Skip";
				m_quizResults.innerHTML = "&nbsp;";
				m_quizEditorText.contentEditable = true;
				m_quizEditor.classList.remove( "disabled" );
				m_quizEditor.classList.remove( "quiz-correct" );
				m_quizEditor.classList.remove( "quiz-wrong" );
			}
		} else {
			m_answersContainer.style.display = "";
			m_openAnswerTextarea.style.display = "none";
			m_quizResetBtn.style.display = "none";
			m_quizEditor.style.display = "none";
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
			m_questionText.textContent = "Error loading quiz.";
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

			// Add a minimum delay to response - to allow for smooth animations
			const minDelay = new Promise( resolve => setTimeout( resolve, DELAY ) );

			// Run the requst
			const data = await Promise.all( [
				main.handleRequest( "/topics/question/", { "topic_id": m_topicId } ),
				minDelay
			] ).then( results => results[ 0 ] );

			// Setup the question data
			setupQuestion( data );

		} catch ( error ) {
			console.error( "Error loading quiz:", error );
			m_questionText.textContent = "Error loading quiz.";
			m_answerButtons.forEach( button => {
				button.textContent = "N/A";
			} );
		} finally {
			toggleLoadingOverlay( true );
		}
	}

	// Submit answer
	async function submitAnswer( answer ) {
		if( m_questionId !== -1 && !m_state.isAnswered ) {
			try {

				// Show loading overlay
				toggleLoadingOverlay( false );

				// Add a minimum delay to response - to allow for smooth animations
				const minDelay = new Promise( resolve => setTimeout( resolve, DELAY ) );

				// Submit answer to server
				const data = await Promise.all( [
					main.handleRequest(
						"/topics/answer/", { "question_id": m_questionId, "answer": answer }
					),
					minDelay
				] ).then( results => results[ 0 ] );
				
				// Update answer response
				updateAnswerResponse( answer, data );

			} catch ( error ) {
				console.error( "Error answering question:", error );
				m_questionText.textContent = "Error answering question.";
				m_answerButtons.forEach( button => {
					button.textContent = "N/A";
				} );
			} finally {
				toggleLoadingOverlay( true );
			}
		}
	}

	function updateAnswerResponse( answer, data ) {

		// Update state and data
		m_state.isAnswered = true;
		updateUI();

		// Update button status
		if( !data.is_open ) {
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
			incScore( true );
			m_quizResults.textContent = "* Correct";
			m_quizResults.classList.add( "result-success" );
			m_quizResults.classList.remove( "result-error" );
			m_quizEditor.classList.add( "quiz-correct" );
			m_openAnswerTextarea.classList.add( "quiz-correct" );
		} else {
			if( answer !== "" ) {
				incScore( false );
			}
			m_quizResults.textContent = "* Wrong";
			m_quizResults.classList.remove( "result-success" );
			m_quizResults.classList.add( "result-error" );
			m_quizEditor.classList.add( "quiz-wrong" );
			m_openAnswerTextarea.classList.add( "quiz-wrong" );
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
		m_questionText.textContent = "Loading question...";
		m_questionDetails.textContent = "";
		m_openAnswerTextarea.value = "";
		m_quizEditorText.textContent = "";
		m_quizEditorCode.textContent = "";
		m_state.isLoadingQuestion = true;
		m_state.isAnswered = false;
		updateUI();
		m_questionId = -1;
	}

	function setupQuestion( data ) {

		// Update state
		m_state.isLoadingQuestion = false;
		m_state.isAnswered = false;
		m_state.isOpen = data.is_open;
		m_state.isCode = data.is_code;
		if( data.is_code ) {
			m_state.isOpen = false;
		}
		updateUI();

		m_data.questionData = data;
		const answers = [];
		if( data.is_code ) {
			let code = data.boilerplate;
			
			// Convert spaces into tabs
			const lines = code.split( "\n" );
			code = "";

			// Detect spaces indent
			for( let line of lines ) {
				code += line.replaceAll( "    ", "\t" ) + "\n";
			}

			m_quizEditorText.textContent  = code;
			m_data.languageClass = data.language_class;
			syncHighlighting();
		} else {

			// Don't shuffle true/false questions
			if( data.answers.length === 2 ) {
				answers.push( data.answers[ 0 ] );
				answers.push( data.answers[ 1 ] );
			} else {

				// Shuffle the answers
				while( data.answers.length > 0 ) {
					const i = Math.floor( Math.random() * data.answers.length );
					const answer = data.answers[ i ];
					data.answers.splice( i, 1 );
					answers.push( answer );
				}
			}
		}
		m_questionId = data.id;
		m_questionText.textContent = data.text;
		if( data.details !== "" ) {
			m_questionDetails.innerHTML = window.marked.parse( data.details );
			hljs.highlightAll();
		}
		m_data[ "question" ] = data.text;
		let maxLength = 0;
		m_answerButtons.forEach( ( button, index ) => {
			if( index >= answers.length ) {
				button.style.display = "none";
				return;
			}
			button.style.display = "";
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

		// Change the style of the buttons for longer text
		if( maxLength > 40 ) {
			m_answerButtons.forEach( button => {
				button.classList.add( "long" );
			} );
		}

		// Adjust the modal size if the container needs to be bigger
		const modal = m_quizModal.querySelector( ".modal" );
		if( m_state.isCode ) {
			modal.style.maxWidth = maxWidth + "px";
		} else if( m_answersContainer.scrollWidth > m_answersContainer.clientWidth ) {
			let maxWidth = m_answersContainer.scrollWidth + 50;
			modal.style.maxWidth = maxWidth + "px";
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

	function resetScore() {
		m_score.correct = 0;
		m_score.total = 0;
		document.querySelector( ".quiz-score" ).textContent = `${m_score.correct}/${m_score.total}`;
	}

	function incScore( isCorrect ) {
		if( isCorrect ) {
			m_score.correct += 1;
		}
		m_score.total += 1;
		document.querySelector( ".quiz-score" ).textContent = `${m_score.correct}/${m_score.total}`;
	}
} );
