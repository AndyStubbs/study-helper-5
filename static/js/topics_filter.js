// static/js/topics_filter.js

"use strict";

/* global window.main */

window.main.onReady( () => {
	const searchBox = document.getElementById( "search-box" );
	const topicsList = document.getElementById( "topics-list" );

	window.main.filter = () => {
		const filter = searchBox.value.toLowerCase();
		const topicsListItems = topicsList.querySelectorAll( "li" );
		topicsListItems.forEach( topic => {
			const topicName = topic.querySelector( "h3" ).textContent.toLowerCase();
			const topicDescription = topic.querySelector( "p" ).textContent.toLowerCase();

			if( topicName.includes( filter ) || topicDescription.includes( filter ) ) {
				topic.style.display = "block";
			} else {
				topic.style.display = "none";
			}
		} );
	};

	// Handle searches
	searchBox.addEventListener( "input", window.main.filter );

	// Handle expand short content
	topicsList.addEventListener( "click", ( e ) => {
		if( e.target && e.target.nodeName === "H3" ) {
			const p = e.target.parentElement.querySelector( "p" );
			const arrow = e.target.querySelector( ".arrow" );
			if( arrow.textContent === "▼" ) {
				arrow.textContent = "▲";
				p.style.maxHeight = p.scrollHeight + "px";
			} else {
				arrow.textContent = "▼";
				p.style.maxHeight = "0px";
			}
		}
	} );
} );
