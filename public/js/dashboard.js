/**
 * dashboard.js — Dashboard sederhana Laundry App
 * Guard login, tampilkan nama user, tombol logout.
 */
(function (global) {
  "use strict";

  // Redirect ke login jika belum login
  if (!global.AuthSession || !global.AuthSession.isLoggedIn()) {
    global.location.replace("/login");
    return;
  }

  const user = global.AuthSession.getUser();

  // Isi heading "Halo, [Nama]!"
  const greeting = document.getElementById("greeting");
  if (greeting) {
    const firstName = (user.name || user.identifier || "Pengguna").split(" ")[0];
    greeting.textContent = "Halo, " + firstName + "!";
  }

  // Isi label nama di subtitle
  const label = document.getElementById("user-label");
  if (label) {
    label.textContent = (user.name || user.identifier || "Pengguna").toUpperCase();
  }

  // Tombol logout → hapus sesi → kembali ke login
  document.getElementById("logout-btn")?.addEventListener("click", function () {
    global.AuthSession.clearUser();
    global.location.replace("/login");
  });

})(window);
