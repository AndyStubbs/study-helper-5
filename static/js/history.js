// static/js/history.js

// TODO update content when topics are deleted or questions are added

"use strict";

window.main.onReady( () => {

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
		const topics = [ ...new Set( m_questionsData.map( question => question.topic ) ) ];
		topics.forEach( topic => {
			const option = document.createElement( "option" );
			option.value = topic;
			option.textContent = topic;
			m_topicFilter.appendChild( option );
		} );
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
			const row = document.createElement( "div" );
			row.classList.add( "history-row" );
			row.innerHTML = `
				<div class="row-cell">${question.topic}</div>
				<div class="row-cell">${question.text}</div>
				<div class="row-cell">${Math.round(question.average * 100)}%</div>
				<div class="row-cell">
					<button onclick="main.showQuestion(${question.id})" class="btn-sm btn-c2">Show</button>
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

	window.main.showQuestion = ( id ) => {
		const question = m_questionsData.find( q => q.id === id );
		let conceptItems = "";
		question.concepts.forEach( concept => {
			conceptItems += `<li>${concept}</li>`;
		} );
		const lastAskedShort = question.last_asked.substring( 0, 10 );
		window.main.alert( `
			<div class="question-details">
				<h3>${question.text}</h3>
				<div class="question-items">
					<div class="info-group">
						<svg
							xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
							stroke="currentColor" stroke-width="2" stroke-linecap="round"
							stroke-linejoin="round" class="feather feather-check-circle"
						>
							<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
							<polyline points="22 4 12 14.01 9 11.01"></polyline>
						</svg>
						<span class="info-label">Correct Count:</span>
						<span>${question.correct}</span>
					</div>
					<div class="info-group">
						<svg
							xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
							stroke="currentColor" stroke-width="2" stroke-linecap="round"
							stroke-linejoin="round" class="feather feather-bar-chart-2"
						>
							<line x1="18" y1="20" x2="18" y2="10"></line>
							<line x1="12" y1="20" x2="12" y2="4"></line>
							<line x1="6" y1="20" x2="6" y2="14"></line>
						</svg>
						<span class="info-label">Average Score:</span>
						<span>${question.average * 100}%</span>
					</div>
					<div class="info-group">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
							stroke="currentColor" stroke-width="2" stroke-linecap="round"
							stroke-linejoin="round" class="feather feather-calendar"
						>
							<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
							<line x1="16" y1="2" x2="16" y2="6"></line>
							<line x1="8" y1="2" x2="8" y2="6"></line>
							<line x1="3" y1="10" x2="21" y2="10"></line>
						</svg>
						<span class="info-label">Last Asked:</span>
						<span title="${question.last_asked}">${lastAskedShort}</span>
					</div>
					<div class="info-group">
						<svg
							xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
							stroke="currentColor" stroke-width="2" stroke-linecap="round"
							stroke-linejoin="round" class="feather feather-book"
						>
							<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
							<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
						</svg>
						<span class="info-label">Main Concept:</span>
						<span>${question.main_concept}</span>
					</div>
				</div>
				<div class="info-concepts">
					<svg
						xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
						stroke="currentColor" stroke-width="2" stroke-linecap="round"
						stroke-linejoin="round" class="feather feather-book-open"
					>
						<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
						<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
					</svg>
					<span class="info-label">Related Concepts:</span>
					<ul class="related-concepts">
						${conceptItems}
					</ul>
				</div>
				<div class="question-buttons">
					<button class=" btn btn-c1" onclick="window.main.explainQuestion(${id})">
						Explain
					</button>
					<button class="btn btn-c1" onclick="window.main.tryQuestion(${id})">\
						Try
					</button>
					<button class="btn btn-c2" onclick="window.main.tryQuestion(${id})">\
						Close
					</button>
				</div>
			</div>
		`, true );
	}

	m_searchInput.addEventListener( "input", renderTable );
	m_topicFilter.addEventListener( "change", renderTable );

	// Initial data load
	loadHistoryData();

} );
