/**
 * auth.js — Session Manager (FreshWash Laundry App)
 * Menyimpan, membaca, dan menghapus data user dari sessionStorage.
 * Dipakai bersama oleh login.js, register.js, dan dashboard.js.
 */
(function (global) {
  "use strict";

  const SESSION_KEY = "freshwash_user";

  /** Simpan objek user ke sessionStorage */
  function setUser(user) {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } catch (_) { /* kuota penuh atau private mode */ }
  }

  /** Ambil data user yang sedang login. Kembalikan null jika belum login. */
  function getUser() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  /** Hapus sesi (logout) */
  function clearUser() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (_) { /* noop */ }
  }

  /** Apakah user sedang login? */
  function isLoggedIn() {
    return getUser() !== null;
  }

  /**
   * Guard: panggil di halaman auth (login/register).
   * Jika sudah login, redirect ke dashboard.
   */
  function requireGuest() {
    if (isLoggedIn()) {
      window.location.replace("/dashboard");
    }
  }

  /**
   * Guard: panggil di halaman yang butuh auth (dashboard, dsb.).
   * Jika belum login, redirect ke login.
   */
  function requireAuth() {
    if (!isLoggedIn()) {
      window.location.replace("/login");
    }
  }

  global.AuthSession = { setUser, getUser, clearUser, isLoggedIn, requireGuest, requireAuth };
})(window);
