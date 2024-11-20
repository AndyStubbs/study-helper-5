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

			const docData = await response.json();
			if( response.ok ) {
				// Add the uploaded document to the list
				addDocumentToList( docData );
				showDocumentPreview( docData );

			} else {
				console.error( "Upload failed:", docData.error );
				window.main.alert( `Error uploading document: ${docData.error}` );
			}
		} catch( error ) {
			console.error( "Error uploading document:", error );
			window.main.alert( "An error occurred while uploading the document." );
		}
	} );

	// Add uploaded document to the list
	function addDocumentToList( docData ) {
		const documentList = document.getElementById( "document-list" );
	
		// Create a document item container
		const docItem = document.createElement( "div" );
		docItem.classList.add( "document-item" );
		docItem.setAttribute( "data-document-id", docData.name );
	
		// Inline HTML structure
		docItem.innerHTML = `
			<label>
				<input type="checkbox" class="document-checkbox">
				${docData.name}
			</label>
			<div class="document-item-buttons">
				<button class="btn btn-sm btn-c2 preview-button">
					<img src="/static/svg/preview.svg" alt="Delete" class="icon-preview">
				</button>
				<button class="btn btn-sm btn-c2 delete-button">
					<img src="/static/svg/trashcan.svg" alt="Delete" class="icon-trash">
				</button>
			</div>
		`;
		
		// Add the preview functionality
		const previewButton = docItem.querySelector( ".preview-button" );
		previewButton.addEventListener( "click", () => {
			getDocPreview( docData.name, docItem );
		} );

		// Add delete functionality
		const deleteButton = docItem.querySelector( ".delete-button" );
		deleteButton.addEventListener( "click", () => {
			deleteDocument( docData.name, docItem );
		} );
	
		// Append the document item to the list
		documentList.appendChild( docItem );

		// Automatically load the preview
		getDocPreview( docData.name, docItem );
	}

	async function getDocPreview( name, docItem ) {
		const docData = await main.handleRequest(
			"/topics/previewdoc/",
			{ "name": name }
		);
		showDocumentPreview( docData );
	}

	async function deleteDocument( name, docItem ) {
		const docData = await main.handleRequest(
			"/topics/deletedoc/",
			{ "name": name }
		);
		docItem.remove();
	}

	// Show document preview
	function showDocumentPreview( docData ) {
		m_previewPlaceholder.style.display = "none";
		m_previewDoc.style.display = "block";
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
