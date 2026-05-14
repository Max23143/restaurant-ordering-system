document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const forgotPasswordForm = document.getElementById("forgotPasswordForm");
  const resetPasswordForm = document.getElementById("resetPasswordForm");

  if (loginForm) {
    loginForm.addEventListener("submit", loginUser);
  }

  if (registerForm) {
    registerForm.addEventListener("submit", registerUser);
  }

  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", sendForgotPasswordLink);
  }

  if (resetPasswordForm) {
    resetPasswordForm.addEventListener("submit", submitResetPassword);
  }

  setupPasswordStrengthChecker(
    "registerPassword",
    "passwordStrengthText",
    "passwordStrengthFill",
    "passwordSuggestions"
  );

  setupPasswordStrengthChecker(
    "resetPasswordInput",
    "resetPasswordStrengthText",
    "resetPasswordStrengthFill",
    "resetPasswordSuggestions"
  );
});

function buildFullPhoneNumber(countryCode, localPhone) {
  const cleanCountryCode = String(countryCode || "").trim();
  const cleanLocalPhone = String(localPhone || "").replace(/\D/g, "");

  if (!cleanCountryCode || !cleanLocalPhone) {
    return "";
  }

  return `${cleanCountryCode}${cleanLocalPhone}`;
}

function evaluatePassword(password) {
  const rules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };

  const passedCount = Object.values(rules).filter(Boolean).length;

  let label = "Weak";
  let cssClass = "weak";
  let width = "20%";

  if (passedCount >= 5) {
    label = "Strong";
    cssClass = "strong";
    width = "100%";
  } else if (passedCount >= 3) {
    label = "Medium";
    cssClass = "medium";
    width = "65%";
  }

  return { rules, passedCount, label, cssClass, width };
}

function setupPasswordStrengthChecker(inputId, textId, fillId, listId) {
  const input = document.getElementById(inputId);
  const text = document.getElementById(textId);
  const fill = document.getElementById(fillId);
  const list = document.getElementById(listId);

  if (!input || !text || !fill || !list) return;

  input.addEventListener("input", () => {
    const password = input.value;
    const result = evaluatePassword(password);

    text.textContent = result.label;
    text.className = `password-strength-text ${result.cssClass}`;

    fill.className = `password-strength-fill ${result.cssClass}`;
    fill.style.width = result.width;

    Object.entries(result.rules).forEach(([ruleName, passed]) => {
      const item = list.querySelector(`[data-rule="${ruleName}"]`);
      if (!item) return;

      item.classList.toggle("passed", passed);
      item.classList.toggle("failed", !passed);
    });
  });
}

function isPasswordStrongEnough(password) {
  const result = evaluatePassword(password);
  return result.passedCount >= 4;
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

  if (!isPasswordStrongEnough(password)) {
    showMessage("authMessage", "Please use a stronger password.", "error");
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

async function sendForgotPasswordLink(event) {
  event.preventDefault();
  hideMessage("forgotPasswordMessage");

  const email = document.getElementById("forgotPasswordEmail")?.value.trim() || "";
  const button = document.getElementById("forgotPasswordBtn");

  if (!email) {
    showMessage("forgotPasswordMessage", "Email is required.", "error");
    return;
  }

  button.disabled = true;
  button.textContent = "Sending...";

  try {
    const response = await apiRequest("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email })
    });

    if (response.resetUrl) {
      showMessage(
        "forgotPasswordMessage",
        `Reset link generated: ${response.resetUrl}`,
        "success"
      );
    } else {
      showMessage(
        "forgotPasswordMessage",
        response.message || "Reset link sent successfully. Check your email.",
        "success"
      );
    }
  } catch (error) {
    console.error("Forgot password failed:", error);
    showMessage("forgotPasswordMessage", error.message || "Failed to send reset link.", "error");
  } finally {
    button.disabled = false;
    button.textContent = "Send Reset Link";
  }
}

async function submitResetPassword(event) {
  event.preventDefault();
  hideMessage("resetPasswordMessage");

  const password = document.getElementById("resetPasswordInput")?.value || "";
  const button = document.getElementById("resetPasswordBtn");

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";

  if (!token) {
    showMessage("resetPasswordMessage", "Reset token is missing.", "error");
    return;
  }

  if (!password) {
    showMessage("resetPasswordMessage", "New password is required.", "error");
    return;
  }

  if (!isPasswordStrongEnough(password)) {
    showMessage("resetPasswordMessage", "Please use a stronger password.", "error");
    return;
  }

  button.disabled = true;
  button.textContent = "Resetting...";

  try {
    await apiRequest("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        token,
        password
      })
    });

    showMessage("resetPasswordMessage", "Password reset successful. Redirecting to login...", "success");

    setTimeout(() => {
      window.location.href = buildFrontendUrl("login.html");
    }, 1000);
  } catch (error) {
    console.error("Reset password failed:", error);
    showMessage("resetPasswordMessage", error.message || "Failed to reset password.", "error");
  } finally {
    button.disabled = false;
    button.textContent = "Reset Password";
  }
}