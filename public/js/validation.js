/**
 * Validasi form di sisi frontend — pesan error yang jelas untuk user.
 */
(function (global) {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function isEmail(value) {
    return EMAIL_RE.test(String(value).trim());
  }

  function validateLogin(data) {
    const errors = {};

    if (!data.identifier || !data.identifier.trim()) {
      errors.identifier = "Username atau email wajib diisi.";
    }

    if (!data.password) {
      errors.password = "Password wajib diisi.";
    } else if (data.password.length < 8) {
      errors.password = "Password minimal 8 karakter.";
    }

    return errors;
  }

  function validateRegister(data) {
    const errors = {};

    if (!data.fullName || data.fullName.trim().length < 3) {
      errors.fullName = "Nama lengkap minimal 3 karakter.";
    }

    if (!data.email || !data.email.trim()) {
      errors.email = "Email wajib diisi.";
    } else if (!isEmail(data.email)) {
      errors.email = "Format email tidak valid.";
    }

    if (!data.username || data.username.trim().length < 3) {
      errors.username = "Username minimal 3 karakter.";
    } else if (!/^[a-zA-Z0-9._]+$/.test(data.username.trim())) {
      errors.username = "Username hanya boleh huruf, angka, titik, dan underscore.";
    }

    if (!data.password) {
      errors.password = "Password wajib diisi.";
    } else if (data.password.length < 8) {
      errors.password = "Password minimal 8 karakter.";
    }

    if (!data.confirmPassword) {
      errors.confirmPassword = "Konfirmasi password wajib diisi.";
    } else if (data.password !== data.confirmPassword) {
      errors.confirmPassword = "Konfirmasi password tidak cocok.";
    }

    return errors;
  }

  global.AuthValidation = {
    isEmail,
    validateLogin,
    validateRegister,
  };
})(window);
