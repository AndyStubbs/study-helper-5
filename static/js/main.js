// static/js/main.js

const g_readyItems = [];

// App wide helper functions
window.main = {
	"onReady": ( callback ) => {
		g_readyItems.push( callback );
	},
	"editTopic": () => { alert( "Not Implemented" ); },
	"quizTopic": () => { alert( "Not Implemented" ); },
	"getCSRFToken": () => {
		const cookieName = "csrftoken";
		const cookies = document.cookie.split( "; " );
		for( const cookie of cookies ) {
			if( cookie.startsWith( `${cookieName}=` ) ) {
				return cookie.split( "=" )[ 1 ];
			}
		}
		return "";
	},
	"handleRequest": async ( endpoint, data ) => {
		const response = await fetch( endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify( data ),
		} );

		if( !response.ok ) {
			throw new Error( `HTTP error! status: ${response.status}` );
		}
		const responseObj = await response.json();
		return responseObj.data;
	},
	"alert": ( msg ) => {
		const alertModal = document.getElementById( "modal-alert" );
		alertModal.style.display = "block";
		alertModal.querySelector( ".alert_message" ).innerHTML = msg;
	}
};

document.addEventListener( "DOMContentLoaded", function () {

	// Select all placeholders with a data-view attribute
	const placeholders = document.querySelectorAll( "[data-view]" );

	let totalItems = 0;
	let loadedCount = 0;
	placeholders.forEach( placeholder => {
		const viewName = placeholder.getAttribute( "data-view" );
		const parts = viewName.split( ":" );
		let url = "";
		if( parts.length > 1 ) {
			// Construct the URL based on the app name and view endpoint
			url = `/${parts[ 0 ]}/${parts[ 1 ]}/`;
		} else {
			url = `/${parts[ 0 ]}`;
		}

		// Increase the count of total items
		totalItems += 1;

		// Fetch the HTML content from the specified view
		fetch( url, { "headers": { "X-Requested-View": viewName } } )
			.then( response => response.text() )
			.then( html => {
				placeholder.innerHTML = html;
			} )
			.catch( error => {
				console.error( `Error loading ${viewName}:`, error );
			} )
			.finally( () => {
				loadedCount += 1;
				if( loadedCount >= totalItems ) {
					g_readyItems.forEach( callback => callback() );
				}
			} );
	} );

	// Handle tabs
	const tabs = document.querySelectorAll( ".tab" );
	const tabContents = document.querySelectorAll( ".tab-content" );

	tabs.forEach( tab => {
		tab.addEventListener( "click", () => {
			const tabId = tab.getAttribute( "data-tab" );
			
			tabs.forEach( t => t.classList.remove( "active" ) );
			tabContents.forEach( content => content.style.display = "none" );
			
			tab.classList.add( "active" );
			document.getElementById( `${tabId}-content` ).style.display = "block";
		} );
	} );

	// Update modal-alert
	const alertModal = document.getElementById( "modal-alert" );
	alertModal.querySelector( ".ok-button" ).addEventListener( "click", () => {
		alertModal.style.display = "none";
	} );
	
} );
