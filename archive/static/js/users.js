// static/js/users.js
"use strict";

/* global window.main */

window.main.onReady( () => {

	let m_userData = undefined;
	const m_loginModal = document.getElementById( "login-modal" );
	const m_loginContainer = document.getElementById( "login-form-container" );
	const m_registerContainer = document.getElementById( "register-form-container" );
	const m_loginForm = document.getElementById( "login-form" );
	const m_registerForm = document.getElementById( "register-form" );
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
	
	// Handle login
	window.main.isLoggedIn = () => {
		if( m_userData ) {
			return m_userData.is_authenticated;
		}
		return false;
	};

	// Handle logout
	window.main.logout = async () => {
		try {
			await window.main.handleRequest( "/users/logout/" );
		} catch {
			// Do nothing
		}
		window.location.reload();
	};

	validateForm();

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
		window.main.openModal( m_loginModal );
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
		const formData = {
			"email": m_registerForm.querySelector( "#register-email" ).value,
			"password": m_registerForm.querySelector( "#register-password" ).value,
		};
		try {
			const response = await window.main.handleRequest( "/users/register/", formData, true );
			m_loadingOverlay.style.visibility = "hidden";

			if( response.success && getUserData( response.userdata ) ) {
				window.main.closeModal( m_loginModal );
				window.main.alert( "Registration successful!" );
			} else {
				window.main.alert( "Registration failed. Please try again." );
			}
		} catch( ex ) {
			window.main.alert( "Registration failed. Please try again." );
		} finally {
			m_loadingOverlay.style.visibility = "hidden";
		}
	} );

	// Handle login form submission
	m_loginForm.addEventListener( "submit", async ( e ) => {
		e.preventDefault();
		m_loadingOverlay.style.visibility = "visible";
		const formData = {
			"email": m_loginForm.querySelector( "#login-email" ).value,
			"password": m_loginForm.querySelector( "#login-password" ).value,
		};
		try {
			const response = await window.main.handleRequest( "/users/login/", formData, true );
			if( response.success && getUserData( response.userdata ) ) {
				window.main.closeModal( m_loginModal );
				window.main.alert( "You are now logged in. Have fun!" );
			} else {
				window.main.alert( "Login failed. Please try again." );
			}
		} catch( ex ) {
			window.main.alert( "Login failed. Please try again." );
		} finally {
			m_loadingOverlay.style.visibility = "hidden";
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

	m_loginModal.querySelectorAll( ".password-container button" ).forEach( btn => {
		btn.addEventListener( "click", e => {
			e.preventDefault();
			const passwordField = btn.parentElement.querySelector( ".password" );
			if(passwordField.type === "password") {
				passwordField.type = "text";
				btn.querySelector( ".eye" ).style.display = "none";
				btn.querySelector( ".eye-slash" ).style.display = "";
			} else {
				passwordField.type = "password";
				btn.querySelector( ".eye" ).style.display = "";
				btn.querySelector( ".eye-slash" ).style.display = "none";
			}
		} );
	} );
} );
