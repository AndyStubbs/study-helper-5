// static/js/users.js
"use strict";

/* global window.main */

window.main.onReady( () => {

	let m_userData = undefined;
	const m_loginModal = document.getElementById( "login-modal" );
	const m_loginContainer = document.getElementById( "login-form-container" );
	const m_registerContainer = document.getElementById( "register-form-container" );
	const m_loginForm = document.getElementById( "login-form" );
	const m_registerForm = document.getElementById( "register-form-container" );
	const m_loadingOverlay = document.getElementById( "login-loading-overlay" );
	const m_registerInput = document.getElementById( "register-email" );
	const m_registerStatus = document.getElementById( "register-status" );
	const m_passwordInput = document.getElementById( "register-password" );
	const m_confirmInput = document.getElementById( "confirm-password" );
	const m_registerButton = document.getElementById( "register-submit-btn" );

	// Add confirm password
	m_registerInput.addEventListener( "input", validateForm );
	m_passwordInput.addEventListener( "input", validateForm );
	m_confirmInput.addEventListener( "input", validateForm );

	getUserData();
	
	window.main.isLoggedIn = () => {
		if( m_userData ) {
			return m_userData.is_authenticated;
		}
		return false;
	};

	/* 
	{
		"is_authenticated": True,
		"user": {
			"email": request.user.email
		},
	} 
	*/
	async function getUserData( userData ) {
		if( userData ) {
			m_userData = userData;
			if( m_userData.is_authenticated ) {
				window.main.loggedin();
			}
			return m_userData.is_authenticated;
		}
		try {
			const response = await fetch( "/users/userdata/" );
			if( !response.ok ) {
				throw new Error( `HTTP error! status: ${response.status}` );
			}
			// Get user data from JSON
			m_userData = await response.json();
			if( m_userData.is_authenticated ) {
				window.main.loggedin();
			} else {
				openLoginModal();
			}
		} catch( error ) {
			console.error( error );
		}
	}

	// Function to open the modal
	function openLoginModal() {
		m_loginModal.style.display = "block";
	}

	function validateForm() {
		// Validate email
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if( !emailRegex.test( m_registerInput.value ) ) {
			m_registerButton.disabled = true;
			m_registerStatus.textContent = "Invalid email address";
			return false;
		}

		// Make sure password is entered, but don't display error just yet
		if( m_passwordInput.value.length === 0 ) {
			m_registerButton.disabled = true;
			m_registerStatus.innerHTML = "&nbsp;";
			return false;
		}

		// Check if password is at least 9 characters long
		if( m_passwordInput.value.length < 9 ) {
			m_registerButton.disabled = true;
			const charLength = 9 - m_passwordInput.value.length;
			m_registerStatus.textContent = `* Chars Remaining: ${charLength}`;
			return false;
		}

		// Check if the password contains at least one special symbol
		const specialSymbols = "!@#$%^&*()-+";
		let containsSymbol = false;

		for( let char of m_passwordInput.value ) {
			if( specialSymbols.includes( char ) ) {
				containsSymbol = true;
				break;
			}
		}

		if( !containsSymbol ) {
			m_registerButton.disabled = true;
			m_registerStatus.textContent = "* No special characters (!@#$%^&*()-+)";
			return false;
		}

		// Check if confirm password matches password
		if( m_confirmInput.value === m_passwordInput.value ) {
			m_registerButton.disabled = false;
			m_registerStatus.innerHTML = "&nbsp;";
			return true;
		} else {
			m_registerButton.disabled = true;
			m_registerStatus.textContent = "* Passwords Don't Match";
			return false;
		}
	}

	// Handle register form submission
	m_registerForm.addEventListener( "submit", async ( e ) => {
		e.preventDefault();
		m_loadingOverlay.style.visibility = "visible";
		const formData = new FormData( m_registerForm );
		const response = await window.main.handleRequest( "/users/register/", formData );
		m_loadingOverlay.style.visibility = "hidden";

		if( response.success && getUserData( response.userdata ) ) {
			window.main.alert( "Registration successful!" );
			m_loginModal.style.display = "none";
		} else {
			window.main.alert( "Registration failed. Please try again." );
		}
	} );

	// Handle login form submission
	m_loginForm.addEventListener( "submit", async ( e ) => {
		e.preventDefault();
		m_loadingOverlay.style.visibility = "visible";
		const formData = new FormData( m_loginForm );
		const response = await window.main.handleRequest( "/users/login/", formData );
		m_loadingOverlay.style.visibility = "hidden";

		if( response.success && getUserData( response.userdata ) ) {
			window.main.alert( "You are now logged in. Have fun!" );
			m_loginModal.style.display = "none";
		} else {
			window.main.alert( "Login failed. Please try again." );
		}
	} );

	// Handle toggle to register form
	m_loginModal.querySelector( "#toggle-to-register" ).addEventListener( "click", ( e ) => {
		e.preventDefault();
		m_loginContainer.style.display = "none";
		m_registerContainer.style.display ="";
	} );

	// Handle toggle to login form
	m_loginModal.querySelector( "#toggle-to-login" ).addEventListener( "click", ( e ) => {
		e.preventDefault();
		m_registerContainer.style.display = "none";
		m_loginContainer.style.display = "";
	} );
} );