// static/js/topics_filter.js

/* global window.main */

window.main.onReady( () => {
	const searchBox = document.getElementById( "search-box" );
	const topicsList = document.getElementById( "topics-list" );

	// Handle searches
	searchBox.addEventListener( "input", () => {
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
	} );

	// Handle expand short content
	topicsList.addEventListener( "click", ( e ) => {
		if( e.target && e.target.classList.contains( "short" ) ) {
			const shortParagraph = e.target;
			const fullParagraph = shortParagraph.parentElement.querySelector( ".full" );
			if( fullParagraph ) {
				fullParagraph.style.display = "";
				shortParagraph.style.display = "none";
			}
		}
	} );
} );
