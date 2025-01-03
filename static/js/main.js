// static/js/main.js

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

		// Clear previous error messages
		document.querySelectorAll( ".result-message" ).forEach( msg  => {
			msg.textContent = "";
			msg.classList.remove( "result-success" );
			msg.classList.remove( "result-error" );
		} );
		return responseObj.data;
	},
	"alert": ( msg, hideButtons ) => {
		return new Promise( ( resolve ) => {
			const alertModal = document.getElementById( "modal-alert" );
			window.main.openModal( alertModal );
			alertModal.querySelector( ".alert-message" ).innerHTML = msg;
	
			const okButton = document.getElementById( "modal-ok" );
	
			// Event listener for "Ok" button
			okButton.onclick = () => {
				window.main.closeModal( alertModal );
				resolve();
			};
	
			// Close modal if the background is clicked
			alertModal.addEventListener( "click", (e) => {
				if (e.target === alertModal) {
					window.main.closeModal( alertModal );
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
			window.main.openModal( confirmModal );
			confirmModal.querySelector( ".alert-message" ).innerHTML = msg;
	
			const yesButton = document.getElementById( "modal-confirm-yes" );
			const noButton = document.getElementById( "modal-confirm-no" );
	
			// Event listener for "Yes" button
			yesButton.onclick = () => {
				window.main.closeModal( confirmModal );
				resolve( true );
			};
	
			// Event listener for "No" button
			noButton.onclick = () => {
				window.main.closeModal( confirmModal );
				resolve( false );
			};
	
			// Close modal if the background is clicked
			confirmModal.addEventListener( "click", ( e ) => {
				if( e.target === confirmModal ) {
					window.main.closeModal( confirmModal );
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
	"isLoggedIn": function () { return false; },
	"openModalList": [],
	"openModal": function ( modal ) {
		modal.style.display = "";
		window.main.disableTabbing( modal );
		window.main.openModalList.push( modal );
	},
	"closeModal": function ( modal ) {
		modal.style.display = "none";
		window.main.enableTabbing();
		window.main.openModalList.pop();
		if( window.main.openModalList.length > 0 ) {
			const nextModal = window.main.openModalList[ window.main.openModalList.length - 1 ];
			window.main.disableTabbing( nextModal );
		}
	},
	"disableTabbing": function ( modal ) {
		const tabbable = document.querySelectorAll(
			"button, [href], input, select, textarea"
		);
		tabbable.forEach( el => {
			if( modal.contains( el ) ) {
				el.removeAttribute( "tabindex" );
			} else if( el.id !== "theme-toggle" ) {
				el.setAttribute( "tabindex", "-1" );
			}
		} );
	},
	"enableTabbing": function () {
		const tabbable = document.querySelectorAll(
			"button, [href], input, select, textarea"
		);
		tabbable.forEach( el => {
			if( 
				el.id !== "theme-toggle"
			) {
				el.removeAttribute( "tabindex" );
			}
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
