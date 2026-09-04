/**
 * login.js — Logika form Login FreshWash Laundry App
 * Menangani validasi, loading state, submit ke API, dan redirect ke dashboard.
 */
(function (global) {
  "use strict";

  function collect(form) {
    return {
      identifier: form.identifier.value.trim(),
      password:   form.password.value,
    };
  }

  /**
   * Setelah login berhasil:
   * 1. Simpan data user ke session
   * 2. Tampilkan banner sukses singkat
   * 3. Redirect ke dashboard
   */
  function onLoginSuccess(json, data) {
    const user = json.user || { identifier: data.identifier };

    // Simpan ke session (dipakai dashboard untuk tampilkan nama)
    global.AuthSession.setUser({
      name:       user.fullName || user.identifier || "Pengguna",
      identifier: user.identifier || data.identifier,
      email:      user.email || "",
      avatar:     user.avatar || null,
      loginMethod: "manual",
      loginAt:    new Date().toISOString(),
    });

    // Redirect ke dashboard setelah jeda singkat
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 500);
  }

  async function submit(form, ui) {
    const data   = collect(form);
    const errors = global.AuthValidation.validateLogin(data);

    ui.clearErrors(form);

    if (Object.keys(errors).length) {
      ui.showErrors(form, errors);
      return;
    }

    ui.setLoading(form, true);

    try {
      const res  = await fetch(window.LAUNDRY_CONFIG.api.login, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        ui.showBanner(form, json.message || "Login gagal. Periksa kredensial Anda.", "error");
        return;
      }

      ui.showBanner(form, "Login berhasil! Mengalihkan...", "success");
      onLoginSuccess(json, data);

    } catch (_err) {
      ui.showBanner(form, "Tidak dapat terhubung ke server. Coba lagi.", "error");
    } finally {
      ui.setLoading(form, false);
    }
  }

  global.LoginForm = { submit };
})(window);
