/**
 * Laundry App — server Express
 * Menyajikan halaman auth (login/register) dan endpoint API placeholder.
 */
const path = require("path");
const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const app = express();
const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
const googleClient = new OAuth2Client(googleClientId);
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
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      ok: false,
      message: "Email dan password wajib diisi.",
    });
  }

  // TODO: verifikasi kredensial di database (cek hash password, dsb.)
  return res.json({
    ok: true,
    message: "Login berhasil.",
    user: {
      fullName: email,   // TODO: ganti dengan nama asli dari DB
      email,
    },
  });
});

/**
 * POST /api/auth/register
 * Placeholder registrasi. Validasi utama ada di frontend; backend tetap cek ulang.
 */
app.get("/api/auth/google/config", (_req, res) => {
  if (!googleClientId) return res.status(503).json({ ok: false, message: "Google Sign-In belum dikonfigurasi." });
  return res.json({ ok: true, clientId: googleClientId });
});

app.post("/api/auth/google", async (req, res) => {
  const { credential } = req.body;
  if (!credential || !googleClientId) {
    return res.status(400).json({ ok: false, message: "Credential Google tidak ditemukan." });
  }

  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: googleClientId });
    const profile = ticket.getPayload();
    if (!profile?.sub || !profile.email || !profile.email_verified) {
      return res.status(401).json({ ok: false, message: "Akun Google tidak dapat diverifikasi." });
    }
    return res.json({
      ok: true,
      message: "Login Google berhasil.",
      user: {
        fullName: profile.name || profile.email,
        email: profile.email,
        avatar: profile.picture || null,
      },
    });
  } catch (_error) {
    return res.status(401).json({ ok: false, message: "Credential Google tidak valid." });
  }
});

app.post("/api/auth/register", (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
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
    user: { fullName, email },
  });
});

app.listen(PORT, () => {
  console.log(`Laundry App berjalan di http://localhost:${PORT}`);
});
