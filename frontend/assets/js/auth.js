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

function buildFullPhoneNumber(countryCode, localPhone) {
  const cleanCountryCode = String(countryCode || "").trim();
  const cleanLocalPhone = String(localPhone || "").replace(/\D/g, "");

  if (!cleanCountryCode || !cleanLocalPhone) {
    return "";
  }

  return `${cleanCountryCode}${cleanLocalPhone}`;
}

async function loginUser(event) {
  event.preventDefault();
  hideMessage("authMessage");

  const email = document.getElementById("loginEmail")?.value.trim() || "";
  const password = document.getElementById("loginPassword")?.value || "";
  const loginBtn = document.getElementById("loginBtn");

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
    }, 500);
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

  const fullName = document.getElementById("registerName")?.value.trim() || "";
  const email = document.getElementById("registerEmail")?.value.trim() || "";
  const countryCode = document.getElementById("registerCountryCode")?.value || "";
  const phoneLocal = document.getElementById("registerPhoneLocal")?.value.trim() || "";
  const password = document.getElementById("registerPassword")?.value || "";
  const registerBtn = document.getElementById("registerBtn");

  const fullPhone = buildFullPhoneNumber(countryCode, phoneLocal);

  if (!fullName || !email || !countryCode || !phoneLocal || !password) {
    showMessage("authMessage", "Full name, email, country code, phone, and password are required.", "error");
    return;
  }

  if (!/^\+\d{7,15}$/.test(fullPhone)) {
    showMessage("authMessage", "Please enter a valid phone number.", "error");
    return;
  }

  registerBtn.disabled = true;
  registerBtn.textContent = "Registering...";

  try {
    const response = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        fullName,
        email,
        phone: fullPhone,
        password
      })
    });

    const token = response.token || response.data?.token;
    const user = response.user || response.data?.user;

    if (!token || !user) {
      throw new Error("Registration response is incomplete.");
    }

    setSession({ token, user });
    showMessage("authMessage", "Registration successful.", "success");

    setTimeout(() => {
      window.location.href = buildFrontendUrl("index.html");
    }, 700);
  } catch (error) {
    console.error("Registration failed:", error);
    showMessage("authMessage", error.message || "Registration failed.", "error");
  } finally {
    registerBtn.disabled = false;
    registerBtn.textContent = "Register";
  }
}