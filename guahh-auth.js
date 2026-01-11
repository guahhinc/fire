/**
 * Guahh Auth Widget
 * OAuth-style popup authentication for Guahh Account
 * Version: 2.0.0
 */

(function (window) {
    'use strict';

    const AUTH_PAGE_URL = 'guahh-auth-page.html';
    const STORAGE_KEY = 'guahh_user';

    let callbacks = {
        login: [],
        logout: []
    };

    let authPopup = null;

    // Public API
    const GuahhAuth = {
        /**
         * Initialize the widget
         * @param {Object} options - Configuration options
         * @param {string} options.authPageUrl - Custom auth page URL (optional)
         */
        init: function (options = {}) {
            const authPageUrl = options.authPageUrl || AUTH_PAGE_URL;

            // Listen for messages from popup
            window.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'GUAHH_AUTH_SUCCESS') {
                    const { user, service } = event.data;

                    // Store user
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

                    // Fire login callbacks
                    callbacks.login.forEach(cb => cb(user, service));

                    // Close popup
                    if (authPopup) {
                        authPopup.close();
                        authPopup = null;
                    }
                }
            });

            // Check for existing session on init
            const storedUser = localStorage.getItem(STORAGE_KEY);
            if (storedUser) {
                const user = JSON.parse(storedUser);
                // Silently notify callbacks that user is already logged in
                callbacks.login.forEach(cb => cb(user, { serviceName: 'Cached Session' }));
            }
        },

        /**
         * Show authentication popup
         * @param {Object} serviceInfo - Information about the service
         * @param {string} serviceInfo.name - Service name
         * @param {string} serviceInfo.url - Service URL
         */
        show: function (serviceInfo = {}) {
            const serviceName = serviceInfo.name || document.title || 'this service';
            const serviceUrl = serviceInfo.url || window.location.origin;

            // Build URL with params
            const params = new URLSearchParams({
                service: serviceName,
                url: serviceUrl
            });

            const authUrl = `${AUTH_PAGE_URL}?${params.toString()}`;

            // Calculate centered popup position
            const width = 500;
            const height = 650;
            const left = Math.round((window.screen.width / 2) - (width / 2));
            const top = Math.round((window.screen.height / 2) - (height / 2));

            const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`;

            // Open popup
            authPopup = window.open(authUrl, 'GuahhAuth', features);

            if (authPopup) {
                authPopup.focus();

                // Poll to detect if popup was closed manually
                const pollTimer = setInterval(() => {
                    if (authPopup && authPopup.closed) {
                        clearInterval(pollTimer);
                        authPopup = null;
                    }
                }, 500);
            } else {
                console.error('Popup blocked. Please allow popups for this site.');
                alert('Please allow popups to sign in with Guahh Account.');
            }
        },

        /**
         * Get currently logged in user
         * @returns {Object|null} User object or null if not logged in
         */
        getUser: function () {
            const storedUser = localStorage.getItem(STORAGE_KEY);
            return storedUser ? JSON.parse(storedUser) : null;
        },

        /**
         * Log out current user
         */
        logout: function () {
            const user = this.getUser();
            localStorage.removeItem(STORAGE_KEY);

            // Fire logout callbacks
            callbacks.logout.forEach(cb => cb(user));
        },

        /**
         * Register callback for login events
         * @param {Function} callback - Function to call on login (user, service) => {}
         */
        onLogin: function (callback) {
            if (typeof callback === 'function') {
                callbacks.login.push(callback);
            }
        },

        /**
         * Register callback for logout events
         * @param {Function} callback - Function to call on logout (user) => {}
         */
        onLogout: function (callback) {
            if (typeof callback === 'function') {
                callbacks.logout.push(callback);
            }
        }
    };

    // Expose to window
    window.GuahhAuth = GuahhAuth;

})(window);
