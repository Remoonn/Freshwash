(function (global) {
  "use strict";

  const config = global.LAUNDRY_CONFIG;

  function showError(message) {
    const form = document.getElementById("form-login");
    const banner = form?.querySelector(".form-banner");
    if (!banner) return;
    banner.hidden = false;
    banner.textContent = message;
    banner.className = "form-banner error";
  }

  async function handleCredentialResponse(response) {
    try {
      const result = await fetch(config.api.google, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const payload = await result.json();

      if (!result.ok || !payload.ok) {
        throw new Error(payload.message || "Login Google gagal.");
      }

      global.AuthSession.setUser({
        name: payload.user.fullName,
        email: payload.user.email,
        avatar: payload.user.avatar || null,
        loginMethod: "google",
        loginAt: new Date().toISOString(),
      });
      global.location.assign("/dashboard");
    } catch (error) {
      showError(error.message || "Login Google gagal.");
    }
  }

  function init() {
    const container = document.getElementById("google-signin-button");
    if (!container) return;

    const render = (clientId) => {
      if (!global.google?.accounts?.id) return;
      global.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      global.google.accounts.id.renderButton(container, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        width: Math.min(container.parentElement?.clientWidth || 400, 400),
      });
    };

    fetch("/api/auth/google/config")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Google Sign-In belum dikonfigurasi.")))
      .then(({ clientId }) => {
        if (global.google?.accounts?.id) render(clientId);
        else global.addEventListener("load", () => render(clientId), { once: true });
      })
      .catch((error) => showError(error.message));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})(window);
