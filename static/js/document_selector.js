// static/js/document_selector.js

"use strict";

window.main.onReady( () => {

	const m_documentSelectorModal = document.getElementById( "document-selector-modal" );
	const m_uploadInput = document.getElementById( "document-upload" );
	const m_documentList = document.getElementById( "document-list" );
	const m_previewPlaceholder = document.querySelector( ".preview-placeholder" );
	const m_previewDoc = document.querySelector( ".preview-doc" );
	const m_previewDocName = document.querySelector( ".preview-doc-name" );
	const m_previewDocContent = document.querySelector( ".preview-doc-content" );
	const m_unselectAllBtn = document.getElementById( "document-clear" );
	const m_selectAllBtn = document.getElementById( "document-select-all" );
	const m_closeBtn = document.getElementById( "document-close-upload" );

	// Open select documents modal
	window.main.selectDocuments = async ( topicId ) => {
		window.main.openModal( m_documentSelectorModal );
		// Get topic settings from server
		toggleLoadingOverlay( false );
		try {
			document.querySelectorAll( "#document-list input[type='checkbox']" ).forEach( chk => {
				chk.checked = false;
			} );
			const response = await main.handleRequest( "/topics/getsettings/", {
				"topic_id": topicId,
			} );
			response.attachments.forEach( id => {
				const chk = document.querySelector(
					`[data-document-id="${id}"] input[type="checkbox"]`
				);
				chk.checked = true;
			} );
		} catch( ex ) {
			window.main.closeModal( m_documentSelectorModal );
			window.main.alert( ex );
		}
		finally {
			toggleLoadingOverlay( true );
		}
	};

	// Get topic attachments
	window.main.getTopicAttachments = () => {
		const attachedDocumentsInput = document.getElementById( "hidden-attached-documents" );
		const attachments = attachedDocumentsInput.value;
		if( attachments === "" ) {
			return [];
		}
		return JSON.parse( attachedDocumentsInput.value  );
	};

	// Close modal event
	m_documentSelectorModal.querySelector( ".close" ).addEventListener( "click", () => {
		window.main.closeModal( m_documentSelectorModal );
	} );

	// Close modal when clicking off modal
	m_documentSelectorModal.addEventListener( "click", ( e ) => {
		if( e.target === e.currentTarget ) {
			window.main.closeModal( m_documentSelectorModal );
		}
	} );

	// Close button
	m_closeBtn.addEventListener( "click", () => {
		window.main.closeModal( m_documentSelectorModal );
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
					addDocumentToList( docData.name, i === 0 );
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

	// Load all documents when logged in
	window.main.onLoggedIn( getAllDocs );

	// Load all documents
	async function getAllDocs() {
		const allDocs = await window.main.handleRequest( "/topics/getalldocs/", {} );
		allDocs.forEach( docName => {
			addDocumentToList( docName, false );
		} );
	}

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
	function addDocumentToList( docName, isJustUploaded ) {
		const docItem = document.createElement( "div" );
		docItem.classList.add( "document-item" );
		docItem.setAttribute( "data-document-id", docName );
	
		// Inline HTML structure
		docItem.innerHTML = `
			<label>
				<input type="checkbox" class="document-checkbox">
				${docName}
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
			getDocPreview( docName, docItem );
		} );

		// Add delete functionality
		const deleteButton = docItem.querySelector( ".delete-button" );
		deleteButton.addEventListener( "click", () => {
			deleteDocument( docName, docItem );
		} );
	
		// Append the document item to the list
		m_documentList.appendChild( docItem );

		// Automatically preview just uploaded documents
		if( isJustUploaded ) {
			getDocPreview( docName, docItem );
		}

		// Checkbox checked changed
		const checkbox = docItem.querySelector( "input[type='checkbox']" );
		checkbox.addEventListener( "input", updateCheckCount );
		checkbox.dataset.name = docName;
	}

	async function getDocPreview( name, docItem ) {
		try {
			const docData = await main.handleRequest(
				"/topics/previewdoc/",
				{ "name": name }
			);
			showDocumentPreview( docData, docItem );
		} catch( ex ) {
			window.main.alert( ex );
		}
	}

	async function deleteDocument( name, docItem ) {
		try {
			await main.handleRequest( "/topics/deletedoc/", { "name": name } );
			if( docItem.querySelector( ".active" ) ) {
				resetUploadState();
			}
			docItem.remove();
			updateCheckCount();
		} catch( ex ) {
			window.main.alert( ex );
		}
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
	}

	function toggleLoadingOverlay( isHidden ) {
		const loadingOverlay = m_documentSelectorModal.querySelector( ".loading-overlay" );
		if( isHidden ) {
			loadingOverlay.style.visibility = "hidden";
		} else {
			loadingOverlay.style.visibility = "visible";
		}
	}

} );
