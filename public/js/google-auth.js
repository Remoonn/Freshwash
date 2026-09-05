/**
 * google-auth.js — Integrasi Google Identity Services (Sign in with Google)
 * Dokumentasi resmi: https://developers.google.com/identity/gsi/web
 *
 * === Cara mengaktifkan Google Sign-In ===
 * 1. Buka https://console.cloud.google.com/
 * 2. Buat project → APIs & Services → Credentials → Create OAuth 2.0 Client ID
 * 3. Application type: Web application
 * 4. Authorized JavaScript origins: tambahkan http://localhost:3000
 * 5. Salin Client ID ke window.LAUNDRY_CONFIG.googleClientId di config.js
 *
 * Selama Client ID masih placeholder, tombol berjalan dalam MODE DEMO
 * (simulasi login berhasil tanpa OAuth sungguhan).
 */
(function (global) {
  "use strict";

  let initialized = false;
  let initializationPromise = null;

  /** Cek apakah Client ID masih placeholder */
  function isPlaceholderClientId(clientId) {
    return !clientId || clientId.indexOf("YOUR_GOOGLE_CLIENT_ID") === 0;
  }

  /**
   * Decode payload dari JWT credential Google.
   * Digunakan untuk mengambil nama, email, dan foto profil user.
   */
  function decodeJwtPayload(credential) {
    try {
      const base64 = credential.split(".")[1]
        .replace(/-/g, "+")
        .replace(/_/g, "/");
      return JSON.parse(atob(base64));
    } catch (_err) {
      return null;
    }
  }

  /** Kirim credential JWT ke backend untuk diverifikasi */
  async function sendCredentialToServer(credential) {
    const res = await fetch(window.LAUNDRY_CONFIG.api.google, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ credential }),
    });
    return res.json();
  }

  /**
   * Inisialisasi Google Identity Services.
   * Dipanggil sekali sebelum renderButton atau prompt.
   */
  async function initialize(onSuccess, onError) {
    if (initialized) return true;

    if (!global.google?.accounts?.id) {
      onError("Google Identity Services belum dimuat. Cek koneksi internet.");
      return false;
    }

    if (!initializationPromise) {
      initializationPromise = fetch(window.LAUNDRY_CONFIG.api.googleConfig)
        .then((response) => response.ok ? response.json() : Promise.reject(new Error("Google OAuth belum dikonfigurasi.")))
        .then((config) => {
          window.LAUNDRY_CONFIG.googleClientId = config.clientId;
          global.google.accounts.id.initialize({
            client_id: config.clientId,
            callback: async (response) => {
              try {
                const result = await sendCredentialToServer(response.credential);
                const profile = decodeJwtPayload(response.credential);
                onSuccess(result, profile);
              } catch (err) {
                onError(err.message || "Gagal memproses login Google.");
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          initialized = true;
          return true;
        })
        .catch((error) => {
          initializationPromise = null;
          onError(error.message);
          return false;
        });
    }

    return initializationPromise;
  }

  /**
   * Render tombol resmi Google ke sebuah container DOM.
   * (Digunakan jika Client ID nyata tersedia)
   */
  function renderButton(container, onSuccess, onError) {
    initialize(onSuccess, onError).then((ready) => {
      if (!ready) return;

      global.google.accounts.id.renderButton(container, {
      type:           "standard",
      theme:          "outline",
      size:           "large",
      text:           "signin_with",
      shape:          "rectangular",
      logo_alignment: "left",
        width: container.offsetWidth || 320,
      });
    });
  }

  /**
   * Tampilkan One Tap prompt Google.
   */
  function prompt(onSuccess, onError) {
    initialize(onSuccess, onError).then((ready) => {
      if (!ready) return;
      global.google.accounts.id.disableAutoSelect();
      global.google.accounts.id.prompt();
    });
  }

  /**
   * Mode DEMO — simulasi login Google berhasil.
   * Aktif saat Client ID masih placeholder.
   * Membuat user palsu yang terlihat seperti akun Google sungguhan.
   */
  function demoLogin(onSuccess) {
    // Simulasi delay seperti request OAuth asli
    const demoProfile = {
      name:    "Demo Google User",
      email:   "demo.user@gmail.com",
      picture: null,
      sub:     "demo_google_id_12345",
    };

    const demoResult = {
      ok:      true,
      message: "Login Google (mode demo) berhasil.",
      user: {
        fullName: demoProfile.name,
        email:    demoProfile.email,
        avatar:   demoProfile.picture,
      },
    };

    setTimeout(() => onSuccess(demoResult, demoProfile), 600);
  }

  global.GoogleAuth = {
    isPlaceholderClientId,
    initialize,
    renderButton,
    prompt,
    demoLogin,
    decodeJwtPayload,
  };
})(window);
