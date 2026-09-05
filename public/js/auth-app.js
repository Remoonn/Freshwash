/**
 * auth-app.js
 * Orkestrasi utama halaman auth FreshWash Laundry:
 *  - Toggle Login/Register via tab bar (tanpa reload penuh)
 *  - Password strength indicator
 *  - Show/hide password toggle
 *  - Helper UI: error, loading, banner
 *  - Modal Lupa Password
 */
(function (global) {
  "use strict";

  // Guard: jika sudah login, langsung ke dashboard
  if (global.AuthSession && global.AuthSession.isLoggedIn()) {
    global.location.replace("/dashboard");
  }

  /* ======= Referensi elemen utama ======= */
  const views = {
    login:    document.getElementById("view-login"),
    register: document.getElementById("view-register"),
  };

  const tabs = {
    login:    document.getElementById("tab-login"),
    register: document.getElementById("tab-register"),
  };

  const indicator  = document.getElementById("tab-indicator");
  const subtitle   = document.getElementById("panel-subtitle");

  /* =============================================
     Helper UI — dipakai oleh login.js & register.js
  ============================================= */
  const ui = {
    /** Hapus semua pesan error dari sebuah form */
    clearErrors(form) {
      form.querySelectorAll(".field-error").forEach((el) => {
        el.textContent = "";
      });
      form.querySelectorAll(".input-wrap").forEach((el) => {
        el.classList.remove("has-error");
      });
      const banner = form.querySelector(".form-banner");
      if (banner) {
        banner.hidden = true;
        banner.textContent = "";
        banner.className = "form-banner";
      }
    },

    /** Tampilkan pesan error per-field */
    showErrors(form, errors) {
      Object.keys(errors).forEach((name) => {
        const field = form.querySelector(`[data-error-for="${name}"]`);
        const wrap  = form.querySelector(`[name="${name}"]`)?.closest(".input-wrap");
        if (field) field.textContent = errors[name];
        if (wrap)  wrap.classList.add("has-error");
      });

      // Fokus ke field error pertama
      const firstErrorField = form.querySelector(".input-wrap.has-error input");
      if (firstErrorField) firstErrorField.focus();
    },

    /** Tampilkan banner pesan global (error / success) */
    showBanner(form, message, type) {
      const banner = form.querySelector(".form-banner");
      if (!banner) return;
      banner.hidden    = false;
      banner.textContent = message;
      banner.className = "form-banner " + type;
    },

    /** Atur loading state tombol submit */
    setLoading(form, loading) {
      const btn = form.querySelector('button[type="submit"]');
      if (!btn) return;
      btn.disabled = loading;
      btn.classList.toggle("is-loading", loading);
    },
  };

  /* =============================================
     Fungsi toggle view Login ↔ Register
  ============================================= */
  function showView(name) {
    const target = name === "register" ? "register" : "login";

    /* Aktifkan view yang dipilih */
    views.login.classList.toggle("is-active", target === "login");
    views.register.classList.toggle("is-active", target === "register");

    /* Update tab aktif */
    tabs.login.classList.toggle("is-active",    target === "login");
    tabs.register.classList.toggle("is-active", target === "register");

    /* Geser indikator tab */
    if (indicator) {
      indicator.classList.toggle("at-register", target === "register");
    }

    /* Update teks subtitle */
    if (subtitle) {
      subtitle.textContent =
        target === "register"
          ? "Buat akun baru, gratis!"
          : "Selamat datang kembali!";
    }

    /* Update ARIA */
    tabs.login.setAttribute("aria-selected",    target === "login"    ? "true" : "false");
    tabs.register.setAttribute("aria-selected", target === "register" ? "true" : "false");

    /* History API — URL berpindah tanpa reload */
    const path = target === "register" ? "/register" : "/login";
    if (global.location.pathname !== path) {
      global.history.pushState({ view: target }, "", path);
    }

    document.title =
      target === "register"
        ? "Daftar — FreshWash Laundry App"
        : "Masuk — FreshWash Laundry App";
  }

  /** Tentukan view dari URL path saat ini */
  function viewFromPath() {
    return global.location.pathname.includes("register") ? "register" : "login";
  }

  /* =============================================
     Password Show/Hide Toggle
  ============================================= */
  function bindPasswordToggles() {
    document.querySelectorAll("[data-toggle-password]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = document.getElementById(btn.getAttribute("aria-controls"));
        if (!input) return;

        const isHidden = input.type === "password";
        input.type = isHidden ? "text" : "password";

        /* Ganti ikon mata */
        const iconShow = btn.querySelector(".eye-icon--show");
        const iconHide = btn.querySelector(".eye-icon--hide");
        if (iconShow) iconShow.style.display = isHidden ? "none"  : "";
        if (iconHide) iconHide.style.display = isHidden ? ""      : "none";

        btn.setAttribute(
          "aria-label",
          isHidden ? "Sembunyikan password" : "Tampilkan password"
        );
      });
    });
  }

  /* =============================================
     Password Strength Indicator
  ============================================= */
  function bindPasswordStrength() {
    const input    = document.getElementById("reg-password");
    const wrapper  = document.getElementById("password-strength");
    const label    = document.getElementById("strength-label");
    if (!input || !wrapper || !label) return;

    input.addEventListener("input", () => {
      const val = input.value;
      if (!val) {
        wrapper.hidden = true;
        return;
      }
      wrapper.hidden = false;

      let score = 0;
      if (val.length >= 8)            score++;
      if (/[A-Z]/.test(val))          score++;
      if (/[0-9]/.test(val))          score++;
      if (/[^A-Za-z0-9]/.test(val))   score++;

      const levels = ["", "Lemah", "Sedang", "Kuat", "Sangat Kuat"];
      wrapper.dataset.level = score;
      label.textContent     = levels[score] || "Lemah";

      // Warna label
      const colors = ["", "#c0392b", "#f59e0b", "#2685e0", "#0f7a4a"];
      label.style.color = colors[score] || "";
    });
  }

  /* =============================================
     Modal Lupa Password
  ============================================= */
  function initForgotModal() {
    const modal       = document.getElementById("forgot-modal");
    const openBtn     = document.getElementById("forgot-password");
    const closeBtn    = document.getElementById("forgot-close");
    const closeBtnBot = document.getElementById("forgot-close-bottom");
    const form        = document.getElementById("form-forgot");
    const message     = document.getElementById("forgot-message");

    function openModal() {
      modal.hidden = false;
      modal.querySelector("input")?.focus();
    }

    function closeModal() {
      modal.hidden = true;
      message.hidden    = true;
      message.textContent = "";
      form.reset();
    }

    openBtn?.addEventListener("click", (e) => { e.preventDefault(); openModal(); });
    closeBtn?.addEventListener("click", closeModal);
    closeBtnBot?.addEventListener("click", closeModal);

    /* Klik backdrop untuk tutup */
    modal?.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    /* Tekan ESC untuk tutup */
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.hidden) closeModal();
    });

    /* Submit form lupa password */
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = form.forgotEmail.value.trim();

      if (!global.AuthValidation.isEmail(email)) {
        message.textContent = "Masukkan alamat email yang valid.";
        message.className   = "form-banner error";
        message.hidden      = false;
        return;
      }

      /* Placeholder — ganti dengan panggilan API reset password */
      message.textContent = "✓ Jika email terdaftar, tautan reset akan dikirim dalam beberapa menit.";
      message.className   = "form-banner success";
      message.hidden      = false;
    });
  }

  /* =============================================
     Inisialisasi utama
  ============================================= */
  function init() {
    const loginForm    = document.getElementById("form-login");
    const registerForm = document.getElementById("form-register");

    /* Bind form submit */
    loginForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      global.LoginForm.submit(loginForm, ui);
    });

    registerForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      global.RegisterForm.submit(registerForm, ui);
    });

    /* Bind tab bar dan link data-switch */
    document.querySelectorAll("[data-switch]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        showView(el.dataset.switch);
      });
    });

    bindPasswordToggles();
    bindPasswordStrength();
    initForgotModal();

    /* Set view awal dari URL */
    showView(viewFromPath());

    /* Handle tombol back/forward browser */
    global.addEventListener("popstate", () => showView(viewFromPath()));
  }

  /* Ekspor ke global agar register.js bisa panggil showView */
  global.AuthApp = { showView, ui };

  /* Jalankan init setelah DOM siap */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
