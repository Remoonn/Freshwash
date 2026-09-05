/**
 * Konfigurasi frontend.
 * Ganti GOOGLE_CLIENT_ID dengan Client ID dari Google Cloud Console
 * (APIs & Services → Credentials → OAuth 2.0 Client ID).
 */
window.LAUNDRY_CONFIG = {
  googleClientId: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
  api: {
    login: "/api/auth/login",
    register: "/api/auth/register",
    google: "/api/auth/google",
    googleConfig: "/api/auth/google/config",
  },
};
