// static/js/main.js

/* TODO:
1. Add a modal open function that opens a modal and disables all tab-index not in the modal -
	Except for the toggle light/dark mode button
2. Move the toggle light/dark mode so that it can be toggled even if modal is showing
3. Make sure that all handleRequest callers have try-catch blocks and report errors.
4. Clear all error messages when handleRequest is successful
*/

"use strict";

const g_readyItems = [];
const g_loggedInItems = [];

// App wide helper functions
window.main = {
	"onReady": ( callback ) => {
		g_readyItems.push( callback );
	},
	"onLoggedIn": ( callback ) => {
		g_loggedInItems.push( callback );
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
	"handleRequest": async ( endpoint, data, skipLogin ) => {
		if( !skipLogin && !window.main.isLoggedIn() ) {
			throw new Error( "You must login to process this request." );
		}
		const response = await fetch( endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-CSRFToken": window.main.getCSRFToken(),
			},
			body: JSON.stringify( data ),
		} );

		if( !response.ok ) {
			throw new Error( `HTTP error! status: ${response.status}` );
		}
		const responseObj = await response.json();
		return responseObj.data;
	},
	"alert": ( msg, hideButtons ) => {
		return new Promise( ( resolve ) => {
			const alertModal = document.getElementById( "modal-alert" );
			alertModal.style.display = "block";
			alertModal.querySelector( ".alert-message" ).innerHTML = msg;
	
			const okButton = document.getElementById( "modal-ok" );
	
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

			if( hideButtons ) {
				okButton.style.display = "none";
			}
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
	},
	"escape": function( text ) {
		const div = document.createElement("div");
		div.textContent = text;
		return div.innerHTML;
	},
	"loggedin": function () {
		g_loggedInItems.forEach( callback => callback() );
	},
	"isLoggedIn": function () { return false; }
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
			document.getElementById( "hljs-light-theme" ).disabled = true;
			document.getElementById( "hljs-dark-theme" ).disabled = false;
		} else {
			document.body.dataset.theme = "dark";
			document.getElementById( "hljs-light-theme" ).disabled = false;
			document.getElementById( "hljs-dark-theme" ).disabled = true;
		}
		localStorage.setItem( "theme", document.body.dataset.theme );
	} );

	// Load theme
	const theme = localStorage.getItem( "theme" );
	if( theme ) {
		document.body.dataset.theme = theme;
		document.getElementById( "hljs-light-theme" ).disabled = theme === "dark";
		document.getElementById( "hljs-dark-theme" ).disabled = theme !== "dark";
	}

	// Handle menu button
	document.getElementById( "burger-menu-btn" ).addEventListener( "click", async () => {
		const confirm = await window.main.confirm( "Logout?" );
		if( confirm ) {
			window.main.logout();
			//alert( "Confirm" );
		}
	} );
} );
