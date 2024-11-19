// static/js/document_selector.js

"use strict";

window.main.onReady( () => {

	const m_documentSelectorModal = document.getElementById( "document-selector-modal" );
	const m_uploadInput = document.getElementById( "document-upload" );
	const m_documentList = document.getElementById( "document-list" );
	const m_documentPreview = document.getElementById( "document-preview" );
	const m_previewPlaceholder = document.querySelector( ".preview-placeholder" );
	const m_previewDoc = document.querySelector( ".preview-doc" );
	const m_previewDocName = document.querySelector( ".preview-doc-name" );
	const m_previewDocContent = document.querySelector( ".preview-doc-content" );
	
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

	// Handle file upload
	m_uploadInput.addEventListener( "change", async (e) => {
		const file = e.target.files[ 0 ];
		if( !file ) {
			return;
		}

		// Preview the uploaded file name
		m_previewPlaceholder.style.display = "none";
		m_previewDoc.style.display = "block";

		try {
			const formData = new FormData();
			formData.append( "file", file );

			// Send the file to the backend
			const response = await fetch( "/topics/uploaddoc/", {
				method: "POST",
				headers: {
					"X-CSRFToken": document.querySelector( "meta[name='csrf-token']" ).content,
				},
				body: formData,
			} );

			const data = await response.json();

			if( response.ok ) {
				// Add the uploaded document to the list
				addDocumentToList( data );
			} else {
				console.error( "Upload failed:", data.error );
				window.main.alert( `Error uploading document: ${data.error}` );
			}
		} catch( error ) {
			console.error( "Error uploading document:", error );
			window.main.alert( "An error occurred while uploading the document." );
		}
	} );

	// Add uploaded document to the list
	function addDocumentToList( docData ) {
		const docItem = document.createElement( "div" );
		docItem.classList.add( "document-item" );
		docItem.textContent = docData.name;
		docItem.addEventListener( "click", () => {
			showDocumentPreview( docData );
		} );
		m_documentList.appendChild( docItem );
	}

	// Show document preview
	function showDocumentPreview( docData ) {
		m_previewPlaceholder.style.display = "none";
		m_previewDocName.textContent = docData.name;
		m_previewDocContent.textContent = docData.preview;
	}

	// Reset upload state
	function resetUploadState() {
		m_uploadInput.value = "";
		m_previewPlaceholder.style.display = "block";
		m_previewDoc.style.display = "none";
		m_documentPreview.innerHTML = "";
	}
} );