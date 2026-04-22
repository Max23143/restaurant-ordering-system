document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (loginForm) {
    loginForm.addEventListener("submit", loginUser);
  }

  if (registerForm) {
    registerForm.addEventListener("submit", registerUserWithOtp);
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
    showMessage("authMessage", error.message || "Login failed.", "error");
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Login";
  }
}

async function registerUserWithOtp(event) {
  event.preventDefault();
  hideMessage("authMessage");

  const fullName = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const phone = document.getElementById("registerPhone").value.trim();
  const password = document.getElementById("registerPassword").value;
  const registerBtn = document.getElementById("registerBtn");

  if (!fullName || !email || !phone || !password) {
    showMessage("authMessage", "Full name, email, phone, and password are required.", "error");
    return;
  }

  registerBtn.disabled = true;
  registerBtn.textContent = "Sending OTP...";

  try {
    await apiRequest("/auth/register/request-otp", {
      method: "POST",
      body: JSON.stringify({
        fullName,
        email,
        phone,
        password
      })
    });

    const enteredOtp = prompt("An OTP has been sent to your phone. Enter it here:");
    if (!enteredOtp) {
      throw new Error("OTP entry cancelled.");
    }

    const verifyResponse = await apiRequest("/auth/register/verify-otp", {
      method: "POST",
      body: JSON.stringify({
        phone,
        otp: enteredOtp
      })
    });

    const token = verifyResponse.token || verifyResponse.data?.token;
    const user = verifyResponse.user || verifyResponse.data?.user;

    if (token && user) {
      setSession({ token, user });
    }

    showMessage("authMessage", "Registration completed successfully.", "success");

    setTimeout(() => {
      window.location.href = buildFrontendUrl("index.html");
    }, 500);
  } catch (error) {
    showMessage("authMessage", error.message || "Registration failed.", "error");
  } finally {
    registerBtn.disabled = false;
    registerBtn.textContent = "Register";
  }
}