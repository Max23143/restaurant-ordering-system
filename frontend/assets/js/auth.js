document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (loginForm) {
    loginForm.addEventListener("submit", loginUser);
  }

  if (registerForm) {
    registerForm.addEventListener("submit", registerUser);
  }
});

async function loginUser(event) {
  event.preventDefault();
  hideMessage("authMessage");

  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const loginBtn = document.getElementById("loginBtn");

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showMessage("authMessage", "Email and password are required.", "error");
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Logging in...";

  try {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    const token = response.token || response.data?.token;
    const user = response.user || response.data?.user;

    if (!token || !user) {
      throw new Error("Login response is incomplete.");
    }

    setSession({ token, user });
    showMessage("authMessage", "Login successful.", "success");

    const role = String(user.role || "customer").toLowerCase();

    setTimeout(() => {
      window.location.href =
        role === "admin"
          ? buildFrontendUrl("admin/dashboard.html")
          : buildFrontendUrl("index.html");
    }, 400);
  } catch (error) {
    console.error("Login failed:", error);
    showMessage("authMessage", error.message || "Login failed.", "error");
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Login";
  }
}

async function registerUser(event) {
  event.preventDefault();
  hideMessage("authMessage");

  const nameInput = document.getElementById("registerName");
  const emailInput = document.getElementById("registerEmail");
  const passwordInput = document.getElementById("registerPassword");
  const registerBtn = document.getElementById("registerBtn");

  const fullName = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!fullName || !email || !password) {
    showMessage("authMessage", "Full name, email, and password are required.", "error");
    return;
  }

  if (registerBtn) {
    registerBtn.disabled = true;
    registerBtn.textContent = "Registering...";
  }

  try {
    const response = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ fullName, email, password })
    });

    const token = response.token || response.data?.token;
    const user = response.user || response.data?.user;

    if (token && user) {
      setSession({ token, user });
    }

    showMessage("authMessage", "Registration successful.", "success");

    setTimeout(() => {
      window.location.href = buildFrontendUrl("index.html");
    }, 500);
  } catch (error) {
    console.error("Registration failed:", error);
    showMessage("authMessage", error.message || "Registration failed.", "error");
  } finally {
    if (registerBtn) {
      registerBtn.disabled = false;
      registerBtn.textContent = "Register";
    }
  }
}