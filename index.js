/**
 * Laundry App — server Express
 * Menyajikan halaman auth (login/register) dan endpoint API placeholder.
 */
const path = require("path");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File statis: HTML, CSS, JS di folder public
app.use(express.static(path.join(__dirname, "public")));

// SPA-like: /login dan /register menampilkan halaman auth yang sama
app.get(["/", "/login", "/register"], (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Route dashboard — guard di sisi frontend (dashboard.js) via sessionStorage
app.get("/dashboard", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

/**
 * POST /api/auth/login
 * Placeholder login manual. Ganti dengan query database + hashing password.
 */
app.post("/api/auth/login", (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({
      ok: false,
      message: "Username/email dan password wajib diisi.",
    });
  }

  // TODO: verifikasi kredensial di database (cek hash password, dsb.)
  return res.json({
    ok: true,
    message: "Login berhasil.",
    user: {
      identifier: identifier,
      fullName:   identifier,   // TODO: ganti dengan nama asli dari DB
      email:      identifier.includes("@") ? identifier : "",
    },
  });
});

/**
 * POST /api/auth/register
 * Placeholder registrasi. Validasi utama ada di frontend; backend tetap cek ulang.
 */
app.post("/api/auth/register", (req, res) => {
  const { fullName, email, username, password } = req.body;

  if (!fullName || !email || !username || !password) {
    return res.status(400).json({
      ok: false,
      message: "Semua field registrasi wajib diisi.",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      ok: false,
      message: "Password minimal 8 karakter.",
    });
  }

  // TODO: simpan user ke database (hash password, cek email unik)
  return res.status(201).json({
    ok: true,
    message: "Akun berhasil dibuat (demo).",
    user: { fullName, email, username },
  });
});

/**
 * POST /api/auth/google
 * Menerima credential JWT dari Google Identity Services.
 * Verifikasi token di server dengan google-auth-library sebelum produksi.
 */
app.post("/api/auth/google", (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({
      ok: false,
      message: "Credential Google tidak ditemukan.",
    });
  }

  // TODO: verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID })
  return res.json({
    ok: true,
    message: "Login Google diterima (demo, token belum diverifikasi).",
  });
});

app.listen(PORT, () => {
  console.log(`Laundry App berjalan di http://localhost:${PORT}`);
});
