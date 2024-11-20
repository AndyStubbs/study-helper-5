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
	const m_unselectAllBtn = document.getElementById( "document-clear" );
	const m_selectAllBtn = document.getElementById( "document-select-all" );
	const m_closeBtn = document.getElementById( "document-close-upload" );

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

	// Close button
	m_closeBtn.addEventListener( "click", () => {
		m_documentSelectorModal.style.display = "none";
	} );

	// Handle Select all items
	m_selectAllBtn.addEventListener( "click", () => {
		document.querySelectorAll( ".document-item .document-checkbox" ).forEach( check => {
			check.checked = true;
		} );
		updateCheckCount();
	} );

	// Handle Unselect all items
	m_unselectAllBtn.addEventListener( "click", () => {
		document.querySelectorAll( ".document-item .document-checkbox" ).forEach( check => {
			check.checked = false;
		} );
		updateCheckCount();
	} );

	// Handle file upload
	m_uploadInput.addEventListener( "change", async ( e ) => {
		const files = e.target.files;
		if( !files || files.length === 0 ) {
			return;
		}

		let errorMessages = [];
		try {
			for( let i = 0; i < files.length; i++ ) {
				try {
					const docData = await uploadFile( files[ i ] );
					addDocumentToList( docData, i === 0 );
				} catch( error ) {
					console.error( `Error uploading file ${files[i].name}:`, error );
					errorMessages.push( `Error uploading file ${files[i].name}: ${error}` );
				}
			}
		} catch( globalError ) {
			console.error( "Unexpected error during file upload process:", globalError );
		}

		// Show a single error message if there are errors
		if( errorMessages.length > 0 ) {
			const errorSummary = errorMessages.join( "\n" );
			window.main.alert( `The following errors occurred:\n\n${errorSummary}` );
		}
	} );

	// Function to upload a single file
	async function uploadFile( file ) {
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
			return docData;
		} else {
			throw docData.error || "An unknown error occurred.";
		}
	}

	// Add uploaded document to the list
	function addDocumentToList( docData, isJustUploaded ) {
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
					<img src="/static/svg/preview.svg" alt="Preview" class="icon-preview">
					<img src="/static/svg/preview-active.svg" alt="Preview" class="icon-preview-active">
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
		m_documentList.appendChild( docItem );

		// Automatically preview just uploaded documents
		if( isJustUploaded ) {
			getDocPreview( docData.name, docItem );
		}

		// Checkbox checked changed
		const checkbox = docItem.querySelector( "input[type='checkbox']" );
		checkbox.addEventListener( "input", updateCheckCount );
		checkbox.dataset.name = docData.name;
	}

	async function getDocPreview( name, docItem ) {
		const docData = await main.handleRequest(
			"/topics/previewdoc/",
			{ "name": name }
		);
		showDocumentPreview( docData, docItem );
	}

	async function deleteDocument( name, docItem ) {
		const docData = await main.handleRequest(
			"/topics/deletedoc/",
			{ "name": name }
		);
		docItem.remove();
	}

	// Show document preview
	function showDocumentPreview( docData, docItem ) {
		m_previewPlaceholder.style.display = "none";
		m_previewDoc.style.display = "block";
		m_previewPlaceholder.style.display = "none";
		m_previewDocName.textContent = docData.name;
		m_previewDocContent.textContent = docData.preview;
		document.querySelectorAll( ".preview-button.active" ).forEach( button => {
			button.classList.remove( "active" );
			button.disabled = false;
		} );
		const previewButton = docItem.querySelector( ".preview-button" );
		previewButton.classList.add( "active" );
		previewButton.disabled = true;
	}

	function updateCheckCount() {
		const checkboxes = document.querySelectorAll( "#document-list .document-checkbox" );
		if( checkboxes.length === 0 ) {
			return;
		}
		let attachedDocuments = [];
		checkboxes.forEach( checkbox => {
			const name = checkbox.dataset.name;
			if( checkbox.checked ) {
				attachedDocuments.push( name );
			} else {
				attachedDocuments = attachedDocuments.filter( name => name === name );
			}
		} );
		const attachedDocumentsInput = document.getElementById( "hidden-attached-documents" );
		attachedDocumentsInput.value = JSON.stringify( attachedDocuments );
		let msg = "";
		if( attachedDocuments.length > 0 ) {
			msg = attachedDocuments.length + " Attached Documents";
		}
		document.getElementById( "topic-doc-count" ).textContent = msg;
	}

	// Reset upload state
	function resetUploadState() {
		m_uploadInput.value = "";
		m_previewPlaceholder.style.display = "block";
		m_previewDoc.style.display = "none";
		m_documentPreview.innerHTML = "";
	}

} );
