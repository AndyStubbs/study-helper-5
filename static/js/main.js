// static/js/main.js
"use strict";

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
		return new Promise( ( resolve ) => {
			const alertModal = document.getElementById( "modal-alert" );
			alertModal.style.display = "block";
			alertModal.querySelector( ".alert-message" ).innerHTML = msg;
	
			const okButton = alertModal.querySelector( ".ok-button" );
	
			// Event listener for "Ok" button
			okButton.onclick = () => {
				alertModal.style.display = "none";
				resolve();
			};
	
			// Close modal if the background is clicked
			alertModal.addEventListener( "click", (e) => {
				if (e.target === alertModal) {
					alertModal.style.display = "none";
					resolve();
				}
			} );
		} );
	},
	"confirm": async ( msg ) => {
		return new Promise( ( resolve ) => {
			const confirmModal = document.getElementById( "modal-confirm" );
			confirmModal.style.display = "block";
			confirmModal.querySelector( ".alert-message" ).innerHTML = msg;
	
			const yesButton = document.getElementById( "modal-confirm-yes" );
			const noButton = document.getElementById( "modal-confirm-no" );
	
			// Event listener for "Yes" button
			yesButton.onclick = () => {
				confirmModal.style.display = "none";
				resolve( true );
			};
	
			// Event listener for "No" button
			noButton.onclick = () => {
				confirmModal.style.display = "none";
				resolve( false );
			};
	
			// Close modal if the background is clicked
			confirmModal.addEventListener( "click", ( e ) => {
				if( e.target === confirmModal ) {
					confirmModal.style.display = "none";
					resolve( false );
				}
			} );
		} );
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

	// Configure tabs
	const tabs = document.querySelectorAll( ".tab" );
	const tabContents = document.querySelectorAll( ".tab-content" );

	tabs.forEach( tab => {
		tab.addEventListener( "click", () => {
			const tabId = tab.getAttribute( "data-tab" );
			main.selectTab( tabId );
		} );
	} );

	// Tab selector method
	window.main.selectTab = function selectTab( tabId ) {
		const tab = document.querySelector( `[data-tab="${tabId}"]` );
		tabs.forEach( t => t.classList.remove( "active" ) );
		tabContents.forEach( content => content.style.display = "none" );
		tab.classList.add( "active" );
		document.getElementById( `${tabId}-content` ).style.display = "block";
	}
	
	// Darkmode toggle
	document.getElementById( "theme-toggle" ).addEventListener( "click", () => {
		if( document.body.dataset.theme === "dark" ) {
			document.body.dataset.theme = "light";
		} else {
			document.body.dataset.theme = "dark";
		}
	} );
} );
