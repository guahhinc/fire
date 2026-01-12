/**
 * Guahh Auth Simple API
 * Easy-to-implement authentication wrapper for Guahh Account
 * Version: 1.0.0
 * 
 * Usage:
 * 1. Include this file in your HTML:
 *    <script src="https://raw.githubusercontent.com/guahhinc/fire/main/guahh-auth.js"></script>
 *    <script src="https://raw.githubusercontent.com/guahhinc/fire/main/guahh-auth-api.js"></script>
 * 
 * 2. Initialize and use:
 *    GuahhAuthAPI.onReady(() => {
 *        const user = GuahhAuthAPI.getCurrentUser();
 *        if (user) {
 *            console.log('Logged in as:', user.displayName);
 *        }
 *    });
 */

(function (window) {
    'use strict';

    // Wait for GuahhAuth to be available
    let isReady = false;
    let readyCallbacks = [];

    function initWhenReady() {
        if (typeof window.GuahhAuth !== 'undefined') {
            isReady = true;

            // Initialize GuahhAuth
            GuahhAuth.init({
                authPageUrl: 'guahh-auth-page.html'
            });

            // Fire all ready callbacks
            readyCallbacks.forEach(cb => cb());
            readyCallbacks = [];
        } else {
            setTimeout(initWhenReady, 50);
        }
    }

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWhenReady);
    } else {
        initWhenReady();
    }

    // Simple API
    const GuahhAuthAPI = {
        /**
         * Register a callback to run when the API is ready
         * @param {Function} callback - Function to call when ready
         */
        onReady: function (callback) {
            if (isReady) {
                callback();
            } else {
                readyCallbacks.push(callback);
            }
        },

        /**
         * Show login popup
         * @param {Object} options - Service info (optional)
         * @param {string} options.serviceName - Name of your service
         * @param {string} options.serviceUrl - URL of your service
         * @param {Function} options.onSuccess - Callback when login succeeds
         */
        showLogin: function (options = {}) {
            const { serviceName, serviceUrl, onSuccess } = options;

            if (onSuccess) {
                GuahhAuth.onLogin((user, service) => {
                    onSuccess(user, service);
                });
            }

            GuahhAuth.show({
                name: serviceName,
                url: serviceUrl
            });
        },

        /**
         * Get currently logged in user
         * @returns {Object|null} User object with properties:
         *   - userId: string
         *   - username: string
         *   - displayName: string
         *   - profilePictureUrl: string
         *   - isVerified: boolean
         *   - connectedServices: array (optional)
         */
        getCurrentUser: function () {
            return GuahhAuth.getUser();
        },

        /**
         * Check if user is logged in
         * @returns {boolean} True if user is logged in
         */
        isLoggedIn: function () {
            return GuahhAuth.getUser() !== null;
        },

        /**
         * Log out current user
         * @param {Function} callback - Optional callback when logout completes
         */
        logout: function (callback) {
            if (callback) {
                GuahhAuth.onLogout(callback);
            }
            GuahhAuth.logout();
        },

        /**
         * Register login event handler
         * @param {Function} handler - Function called on login (user, service) => {}
         */
        onLogin: function (handler) {
            GuahhAuth.onLogin(handler);
        },

        /**
         * Register logout event handler
         * @param {Function} handler - Function called on logout (user) => {}
         */
        onLogout: function (handler) {
            GuahhAuth.onLogout(handler);
        },

        /**
         * Update UI element with user info
         * @param {string} elementId - ID of element to update
         * @param {string} property - User property to display (displayName, username, profilePictureUrl)
         */
        updateElement: function (elementId, property = 'displayName') {
            const user = this.getCurrentUser();
            const element = document.getElementById(elementId);

            if (!element) {
                console.error(`Element with ID "${elementId}" not found`);
                return;
            }

            if (!user) {
                element.textContent = '';
                return;
            }

            if (property === 'profilePictureUrl') {
                const pfp = user.profilePictureUrl ||
                    `https://api.dicebear.com/8.x/thumbs/svg?seed=${user.username}`;
                if (element.tagName === 'IMG') {
                    element.src = pfp;
                } else {
                    element.style.backgroundImage = `url(${pfp})`;
                }
            } else {
                element.textContent = user[property] || '';
            }
        },

        /**
         * Auto-bind login button
         * Automatically shows login popup when button is clicked
         * @param {string} buttonId - ID of button element
         * @param {Object} options - Same as showLogin options
         */
        bindLoginButton: function (buttonId, options = {}) {
            const button = document.getElementById(buttonId);
            if (!button) {
                console.error(`Button with ID "${buttonId}" not found`);
                return;
            }

            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLogin(options);
            });
        },

        /**
         * Auto-bind logout button
         * @param {string} buttonId - ID of button element
         */
        bindLogoutButton: function (buttonId) {
            const button = document.getElementById(buttonId);
            if (!button) {
                console.error(`Button with ID "${buttonId}" not found`);
                return;
            }

            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        },

        /**
         * Toggle element visibility based on login state
         * @param {string} elementId - ID of element
         * @param {boolean} showWhenLoggedIn - If true, show when logged in; if false, hide when logged in
         */
        toggleOnAuth: function (elementId, showWhenLoggedIn = true) {
            const element = document.getElementById(elementId);
            if (!element) {
                console.error(`Element with ID "${elementId}" not found`);
                return;
            }

            const updateVisibility = () => {
                const isLoggedIn = this.isLoggedIn();
                element.style.display = (isLoggedIn === showWhenLoggedIn) ? '' : 'none';
            };

            // Update initially
            updateVisibility();

            // Update on login/logout
            this.onLogin(updateVisibility);
            this.onLogout(updateVisibility);
        }
    };

    // Expose to window
    window.GuahhAuthAPI = GuahhAuthAPI;

})(window);
