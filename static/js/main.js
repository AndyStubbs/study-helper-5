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

} );
