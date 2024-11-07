// static/js/main.js

const JS_VER = new Date().getTime();

// App wide helper functions
window.main = {
	"loadScript": ( src ) => {
		const script = document.createElement( "script" );
		script.src = `${src}?v=${JS_VER}`;
		script.defer = true;
		document.head.appendChild( script );
	},
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
	"handleRequestSrv": async ( endpoint, data ) => {
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

		return await response.json();;
	},
	"handleRequestSim": async ( endpoint, data ) => {
		
	}
};

document.addEventListener( "DOMContentLoaded", function () {

	// Select all placeholders with a data-view attribute
	const placeholders = document.querySelectorAll( "[data-view]" );

	placeholders.forEach( placeholder => {
		const viewName = placeholder.getAttribute( "data-view" );
		const [appName, viewEndpoint] = viewName.split( ":" );

		// Construct the URL based on the app name and view endpoint
		const url = `/${appName}/${viewEndpoint}/`;

		// Fetch the HTML content from the specified view
		fetch( url, { "headers": { "X-Requested-View": viewName } } )
			.then( response => response.text() )
			.then( html => {
				placeholder.innerHTML = html;
				placeholder.querySelectorAll( "script" ).forEach( script => {
					main.loadScript( script.src );
				} );
			} )
			.catch( error => console.error( `Error loading ${viewName}:`, error ) );
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

} );
