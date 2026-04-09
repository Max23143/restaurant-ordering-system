document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (loginForm) loginForm.addEventListener("submit", loginUser);
  if (registerForm) registerForm.addEventListener("submit", registerUser);
});

async function loginUser(event) {
  event.preventDefault();
  hideMessage("authMessage");

  const payload = {
    email: document.getElementById("loginEmail").value.trim(),
    password: document.getElementById("loginPassword").value
  };

  try {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    setSession({
      token: response.token,
      user: response.user || { email: payload.email }
    });

    const role = response.user?.role || "customer";
    window.location.href = role === "admin" ? "admin/dashboard.html" : "index.html";
  } catch (error) {
    showMessage("authMessage", error.message, "error");
  }
}

async function registerUser(event) {
  event.preventDefault();
  hideMessage("authMessage");

  const payload = {
    fullName: document.getElementById("registerName").value.trim(),
    email: document.getElementById("registerEmail").value.trim(),
    password: document.getElementById("registerPassword").value
  };

  try {
    const response = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    setSession({
      token: response.token,
      user: response.user || {
        fullName: payload.fullName,
        email: payload.email,
        role: "customer"
      }
    });

    showMessage("authMessage", "Registration successful.", "success");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 800);
  } catch (error) {
    showMessage("authMessage", error.message, "error");
  }
}