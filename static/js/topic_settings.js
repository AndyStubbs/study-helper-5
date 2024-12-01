// static/js/topic_settings.js

"use strict";

window.main.onReady( () => {
	const m_topicSettingsModal = document.getElementById( "topic-settings-modal" );
	const m_closeBtn = document.getElementById( "topic-settings-ok" );
	let m_data = {
		"mcq-frequency": 70,
		"tf-frequency": 20,
		"open-text-frequency": 10,
		"document-frequency": 50,
		"non-document-frequency": 50
	};

	// Open select documents modal
	window.main.topicSettings = async ( topicId ) => {
		m_topicSettingsModal.style.display = "";

		// Get topic settings from server
		toggleLoadingOverlay( false );
		try {
			const response = await main.handleRequest( "/topics/getsettings/", {
				"topic_id": topicId,
			} );
			m_data = response.settings;
		} catch( ex ) {
			m_topicSettingsModal.style.display = "none";
			window.main.alert( ex );
		}
		finally {
			toggleLoadingOverlay( true );
		}

		// Load data values
		Object.entries( m_data ).forEach( ( [ key, value ] ) => {
			m_topicSettingsModal.querySelector( `#${key}` ).value = value;
			const valueSpan = m_topicSettingsModal.querySelector( `#${key}-value` );
			valueSpan.textContent = `${value}%`;
		} );
	};

	// Get topic settings
	window.main.getTopicSettings = () => {
		return m_data;
	};
	
	// Close modal event
	m_topicSettingsModal.querySelector( ".close" ).addEventListener( "click", () => {
		m_topicSettingsModal.style.display = "none";
	} );

	// Close modal when clicking off modal
	m_topicSettingsModal.addEventListener( "click", ( e ) => {
		if( e.target === e.currentTarget ) {
			m_topicSettingsModal.style.display = "none";
		}
	} );

	// Close button
	m_closeBtn.addEventListener( "click", () => {
		m_topicSettingsModal.style.display = "none";
	} );

	// Update frequency values in real-time
	m_topicSettingsModal.querySelectorAll( "input[type='range']" ).forEach( slider => {
		slider.addEventListener( "input", function () {
			m_data[ this.id ] = parseInt( this.value );
			const valueSpan = m_topicSettingsModal.querySelector( `#${this.id}-value` );
			valueSpan.textContent = `${this.value}%`;
		} );
	} );

	function toggleLoadingOverlay( isHidden ) {
		const loadingOverlay = m_topicSettingsModal.querySelector( ".loading-overlay" );
		if( isHidden ) {
			loadingOverlay.style.visibility = "hidden";
		} else {
			loadingOverlay.style.visibility = "visible";
		}
	}
} );
