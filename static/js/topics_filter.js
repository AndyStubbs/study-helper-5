// static/js/topics_filter.js

( function () {
	const searchBox = document.getElementById( "search-box" );
	const topicsList = document.querySelectorAll( ".topic-item" );

	searchBox.addEventListener( "input", () => {
		const filter = searchBox.value.toLowerCase();

		topicsList.forEach( topic => {
			const topicName = topic.querySelector( "h3" ).textContent.toLowerCase();
			const topicDescription = topic.querySelector( "p" ).textContent.toLowerCase();

			if( topicName.includes( filter ) || topicDescription.includes( filter ) ) {
				topic.style.display = "block";
			} else {
				topic.style.display = "none";
			}
		} );
	} );
} )();
