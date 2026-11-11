const AUTH_STORAGE_KEY = "aylzz_crypto_session";
const form = document.getElementById("local-login-form");
const emailInput = document.getElementById("local-email");
const passwordInput = document.getElementById("local-password");
const note = document.getElementById("login-note");

function hasValidSession() {
    try {
        const session = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || "null");
        return Boolean(session && session.email && session.expiresAt > Date.now());
    } catch {
        return false;
    }
}

if (hasValidSession()) {
    window.location.href = "/dashboard/";
}

form?.addEventListener("submit", event => {
    event.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email.includes("@") || password.length < 4) {
        note.textContent = "Verifica el correo y usa una clave de al menos 4 caracteres.";
        note.classList.add("error");
        return;
    }

    const button = form.querySelector("button");
    button.classList.add("loading");
    button.querySelector("span").textContent = "Preparando laboratorio...";

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        email,
        name: email.split("@")[0],
        issuedAt: Date.now(),
        expiresAt: Date.now() + 8 * 60 * 60 * 1000
    }));

    window.setTimeout(() => {
        window.location.href = "/dashboard/";
    }, 650);
});
