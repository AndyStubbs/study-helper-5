// static/js/document_selector.js

"use strict";

window.main.onReady( () => {

	const m_documentSelectorModal = document.getElementById( "document-selector-modal" );

	// Open select documents modal
	window.main.selectDocuments = ( topicId ) => {
		m_documentSelectorModal.style.display = "";
	};

	// Close modal event
	m_documentSelectorModal.querySelector( ".close" ).addEventListener( "click", () => {
		m_documentSelectorModal.style.display = "none";
	} );

	// Close modal when clicking off modal
	m_documentSelectorModal.addEventListener( "click", ( e ) => {
		if( e.target === e.currentTarget ) {
			m_documentSelectorModal.style.display = "none";
		}
	} );

} );