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
			const matchesSearch = question.text.toLowerCase().includes( searchText );
			const matchesTopic = selectedTopic ? question.topic === selectedTopic : true;
			return matchesSearch && matchesTopic;
		} );

		m_historyBody.innerHTML = "";
		filteredData.forEach( ( question, index ) => {
			const row = document.createElement( "div" );
			row.classList.add( "history-row" );
			row.innerHTML = `
				<div class="row-cell">${question.topic}</div>
				<div class="row-cell">${question.text}</div>
				<div class="row-cell">${Math.round(question.average * 100)}%</div>
				<div class="row-cell">
					<button onclick="main.showQuestion(${index})" class="btn-sm btn-c2">Show</button>
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
		window.main.alert( id );
	}
	m_searchInput.addEventListener( "input", renderTable );
	m_topicFilter.addEventListener( "change", renderTable );

	// Initial data load
	loadHistoryData();

} );
