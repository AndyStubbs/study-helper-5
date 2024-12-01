// static/js/history.js

"use strict";

window.main.onReady( () => {

	window.main.loadHistory = loadHistoryData;

	const m_historyBody = document.querySelector( ".history-body" );
	const m_searchInput = document.getElementById( "search-input" );
	const m_topicFilter = document.getElementById( "topic-filter" );
	let m_questionsData = [];

	// Load and render data
	async function loadHistoryData() {
		const data = await window.main.handleRequest( "/topics/history/" );
		m_questionsData = data;
		populateTopicsFilter();
		renderTable();
	}

	// Populate the topic filter dropdown
	function populateTopicsFilter() {
		const selectedTopic = m_topicFilter.value;
		m_topicFilter.innerHTML = "<option value=''>All Topics</option>";
		const topics = [ ...new Set( m_questionsData.map( question => question.topic ) ) ];
		topics.sort();
		topics.forEach( topic => {
			const option = document.createElement( "option" );
			option.value = topic;
			option.textContent = topic;
			m_topicFilter.appendChild( option );
		} );
		m_topicFilter.value = selectedTopic;
	}

	// Render the table rows based on data
	function renderTable() {
		const searchText = m_searchInput.value.toLowerCase();
		const selectedTopic = m_topicFilter.value;
		const filteredData = m_questionsData.filter( question => {
			const matchesSearch = (
				question.text.toLowerCase().includes( searchText ) ||
				question.topic.toLowerCase().includes( searchText )
			);
			const matchesTopic = selectedTopic ? question.topic === selectedTopic : true;
			return matchesSearch && matchesTopic;
		} );

		m_historyBody.innerHTML = "";
		filteredData.forEach( ( question ) => {
			const topic = window.main.escape( question.topic );
			const text = window.main.escape( question.text );
			const row = document.createElement( "div" );
			row.classList.add( "history-row" );
			row.innerHTML = `
				<div class="row-cell">${topic}</div>
				<div class="row-cell">${text}</div>
				<div class="row-cell">${Math.round(question.average * 100)}%</div>
				<div class="row-cell">
					<button 
						onclick="main.showQuestion(${question.id}, ${question.topic_id})"
						class="btn-sm btn-c2"
					>
						Show
					</button>
				</div>
			`;
			m_historyBody.appendChild( row );
		} );
	}

	// Sorting function
	function sortTable( sortField, sortDir, isNum ) {
		m_questionsData.sort( ( a, b ) => {
			let valueA, valueB;
			if( isNum ) {
				valueA = a[ sortField ];
				valueB = b[ sortField ];
			} else {
				valueA = a[ sortField ].toLowerCase();
				valueB = b[ sortField ].toLowerCase();
			}
			if( valueA < valueB ) {
				return -sortDir;
			}
			if( valueA > valueB ) {
				return sortDir;
			}
			return 0;
		} );
		renderTable();
	}

	// Event listeners
	document.querySelectorAll( ".sortable" ).forEach( header => {
		header.addEventListener( "click", () => {
			const sortField = header.getAttribute( "data-sort" );
			const isNum = header.getAttribute( "data-num" ) === "true";
			let sortDesc = header.getAttribute( "data-desc" ) === "true";
			let sortDir = 0;
			let title = header.textContent.replace( " ▼", "" ).replace( " ▲", "" );
			sortDesc = !sortDesc;
			if( sortDesc ) {
				title += " ▼";
				sortDir = 1;
			} else {
				title += " ▲";
				sortDir = -1;
			}
			sortTable( sortField, sortDir, isNum );
			header.setAttribute( "data-desc", sortDesc );
			header.textContent = title;
		} );
	} );

	// Show Question Modal
	window.main.showQuestion = ( id, topicId ) => {
		const question = m_questionsData.find( q => q.id === id );
		const escape = window.main.escape;
		let conceptItems = "";
		question.concepts.forEach( concept => {
			conceptItems += `<li>${escape(concept)}</li>`;
		} );
		const lastAskedShort = question.last_asked.substring( 0, 10 );
		const qdModal = document.getElementById( "qd-modal" );
		qdModal.style.display = "";
		document.getElementById( "qd-text" ).innerHTML = escape( question.text );
		document.getElementById( "qd-correct" ).innerHTML = question.correct;
		document.getElementById( "qd-average" ).innerHTML = Math.round(
			question.average * 100
		) + "%";
		document.getElementById( "qd-last-asked" ).innerHTML = lastAskedShort;
		document.getElementById( "qd-main-concept" ).innerHTML = escape( question.main_concept );
		document.getElementById( "qd-related-concepts" ).innerHTML = conceptItems;
		document.getElementById( "qd-explain" ).onclick = () => {
			window.main.explain( id );
			qdModal.style.display = "none";
		};
		document.getElementById( "qd-try" ).onclick = () => {
			window.main.quizQuestion( id, topicId );
			qdModal.style.display = "none";
		};
		document.getElementById( "qd-close" ).onclick = () => {
			qdModal.style.display = "none";
		};
		qdModal.onclick = ( e ) => {
			if( e.target === e.currentTarget ) {
				qdModal.style.display = "none";
			}
		}
	}

	m_searchInput.addEventListener( "input", renderTable );
	m_topicFilter.addEventListener( "change", renderTable );

	// Initial data load
	window.main.onLoggedIn( loadHistoryData );

} );
