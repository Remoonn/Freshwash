/**
 * Laundry App — server Express
 * Menyajikan halaman auth (login/register) dan endpoint API placeholder.
 */
const path = require("path");
const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const app = express();
const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
const databasePool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : null;
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
app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({ ok: false, message: "Email dan password wajib diisi." });
  }
  if (!databasePool) {
    return res.status(503).json({ ok: false, message: "Layanan login belum tersedia." });
  }

  try {
    const result = await databasePool.query(
      `select u.name, u.email, u.image, a.password
       from neon_auth."user" u
       join neon_auth.account a on a."userId" = u.id
       where lower(u.email) = $1 and a."providerId" = 'credential'
       limit 1`,
      [email]
    );
    const account = result.rows[0];
    const validPassword = account?.password ? await bcrypt.compare(password, account.password) : false;

    if (!account || !validPassword) {
      return res.status(401).json({
        ok: false,
        message: "Email belum terdaftar atau password salah. Silakan daftar terlebih dahulu atau gunakan Sign in with Google.",
      });
    }

    return res.json({
      ok: true,
      message: "Login berhasil.",
      user: { fullName: account.name, email: account.email, avatar: account.image || null },
    });
  } catch (error) {
    console.error("[v0] Login database error:", error.message);
    return res.status(500).json({ ok: false, message: "Login gagal. Silakan coba lagi." });
  }
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
    if (!databasePool) {
      return res.status(503).json({ ok: false, message: "Layanan login belum tersedia." });
    }

    const client = await databasePool.connect();
    try {
      await client.query("begin");
      const userResult = await client.query(
        `insert into neon_auth."user" (name, email, "emailVerified", image, "createdAt", "updatedAt")
         values ($1, $2, true, $3, current_timestamp, current_timestamp)
         on conflict (email) do update set name = excluded.name, image = excluded.image, "emailVerified" = true, "updatedAt" = current_timestamp
         returning id, name, email, image`,
        [profile.name || profile.email, profile.email.toLowerCase(), profile.picture || null]
      );
      const user = userResult.rows[0];
      await client.query(
        `insert into neon_auth.account ("accountId", "providerId", "userId", "idToken", "createdAt", "updatedAt")
         values ($1, 'google', $2, $3, current_timestamp, current_timestamp)
         on conflict do nothing`,
        [profile.sub, user.id, credential]
      );
      await client.query("commit");
      return res.json({
        ok: true,
        message: "Login Google berhasil.",
        user: { fullName: user.name, email: user.email, avatar: user.image || null },
      });
    } catch (error) {
      await client.query("rollback");
      console.error("[v0] Google account database error:", error.message);
      return res.status(500).json({ ok: false, message: "Login Google gagal. Silakan coba lagi." });
    } finally {
      client.release();
    }
  } catch (_error) {
    return res.status(401).json({ ok: false, message: "Credential Google tidak valid." });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const fullName = String(req.body.fullName || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!fullName || !email || !password) {
    return res.status(400).json({ ok: false, message: "Semua field registrasi wajib diisi." });
  }
  if (password.length < 8) {
    return res.status(400).json({ ok: false, message: "Password minimal 8 karakter." });
  }
  if (!databasePool) {
    return res.status(503).json({ ok: false, message: "Layanan pendaftaran belum tersedia." });
  }

  const client = await databasePool.connect();
  try {
    await client.query("begin");
    const existing = await client.query(
      `select id from neon_auth."user" where lower(email) = $1 limit 1`,
      [email]
    );
    if (existing.rowCount) {
      await client.query("rollback");
      return res.status(409).json({ ok: false, message: "Email sudah terdaftar. Silakan login atau gunakan Sign in with Google." });
    }

    const userResult = await client.query(
      `insert into neon_auth."user" (name, email, "emailVerified", "createdAt", "updatedAt")
       values ($1, $2, false, current_timestamp, current_timestamp)
       returning id, name, email`,
      [fullName, email]
    );
    const user = userResult.rows[0];
    const passwordHash = await bcrypt.hash(password, 12);
    await client.query(
      `insert into neon_auth.account ("accountId", "providerId", "userId", password, "createdAt", "updatedAt")
       values ($1, 'credential', $2, $3, current_timestamp, current_timestamp)`,
      [email, user.id, passwordHash]
    );
    await client.query("commit");

    return res.status(201).json({ ok: true, message: "Akun berhasil dibuat.", user: { fullName: user.name, email: user.email } });
  } catch (error) {
    await client.query("rollback");
    console.error("[v0] Registration database error:", error.message);
    return res.status(500).json({ ok: false, message: "Pendaftaran gagal. Silakan coba lagi." });
  } finally {
    client.release();
  }
});

app.listen(PORT, () => {
  console.log(`Laundry App berjalan di http://localhost:${PORT}`);
});
