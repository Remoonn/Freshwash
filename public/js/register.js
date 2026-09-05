/**
 * register.js — Logika form Register FreshWash Laundry App
 * Menangani validasi, loading state, submit ke API, lalu redirect ke login.
 */
(function (global) {
  "use strict";

  function collect(form) {
    return {
      fullName:        form.fullName.value.trim(),
      email:           form.email.value.trim(),
      password:        form.password.value,
      confirmPassword: form.confirmPassword.value,
    };
  }

  async function submit(form, ui) {
    const data   = collect(form);
    const errors = global.AuthValidation.validateRegister(data);

    ui.clearErrors(form);

    if (Object.keys(errors).length) {
      ui.showErrors(form, errors);
      return;
    }

    ui.setLoading(form, true);

    try {
      const res  = await fetch(window.LAUNDRY_CONFIG.api.register, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          fullName: data.fullName,
          email:    data.email,
          password: data.password,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        ui.showBanner(form, json.message || "Registrasi gagal. Coba lagi.", "error");
        return;
      }

      ui.showBanner(form, "✓ Akun berhasil dibuat! Mengarahkan ke halaman login...", "success");
      form.reset();

      // Setelah daftar → arahkan ke halaman login
      setTimeout(() => {
        if (global.AuthApp) {
          global.AuthApp.showView("login");
        } else {
          window.location.href = "/login";
        }
      }, 1200);

    } catch (_err) {
      ui.showBanner(form, "Tidak dapat terhubung ke server. Coba lagi.", "error");
    } finally {
      ui.setLoading(form, false);
    }
  }

  global.RegisterForm = { submit };
})(window);
