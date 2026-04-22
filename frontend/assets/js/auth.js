document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const verifyOtpForm = document.getElementById("verifyOtpForm");
  const resendOtpBtn = document.getElementById("resendOtpBtn");

  if (loginForm) {
    loginForm.addEventListener("submit", loginUser);
  }

  if (registerForm) {
    registerForm.addEventListener("submit", requestRegisterOtp);
  }

  if (verifyOtpForm) {
    verifyOtpForm.addEventListener("submit", verifyRegisterOtp);
  }

  if (resendOtpBtn) {
    resendOtpBtn.addEventListener("click", resendRegisterOtp);
  }
});

let pendingRegisterData = null;

async function loginUser(event) {
  event.preventDefault();
  hideMessage("authMessage");

  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const loginBtn = document.getElementById("loginBtn");

  const email = emailInput?.value.trim() || "";
  const password = passwordInput?.value || "";

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

async function requestRegisterOtp(event) {
  event.preventDefault();
  hideMessage("authMessage");

  const fullName = document.getElementById("registerName")?.value.trim() || "";
  const email = document.getElementById("registerEmail")?.value.trim() || "";
  const phone = document.getElementById("registerPhone")?.value.trim() || "";
  const password = document.getElementById("registerPassword")?.value || "";
  const registerBtn = document.getElementById("registerBtn");
  const otpSection = document.getElementById("otpSection");

  if (!fullName || !email || !phone || !password) {
    showMessage("authMessage", "Full name, email, phone, and password are required.", "error");
    return;
  }

  pendingRegisterData = {
    fullName,
    email,
    phone,
    password
  };

  registerBtn.disabled = true;
  registerBtn.textContent = "Sending OTP...";

  try {
    await apiRequest("/auth/register/request-otp", {
      method: "POST",
      body: JSON.stringify(pendingRegisterData)
    });

    otpSection.classList.remove("hide");
    showMessage("authMessage", "OTP sent successfully. Enter the OTP below to complete registration.", "success");

    const otpInput = document.getElementById("registerOtp");
    if (otpInput) otpInput.focus();
  } catch (error) {
    console.error("OTP request failed:", error);
    showMessage("authMessage", error.message || "Failed to send OTP.", "error");
  } finally {
    registerBtn.disabled = false;
    registerBtn.textContent = "Send OTP";
  }
}

async function verifyRegisterOtp(event) {
  event.preventDefault();
  hideMessage("authMessage");

  const verifyOtpBtn = document.getElementById("verifyOtpBtn");
  const otp = document.getElementById("registerOtp")?.value.trim() || "";

  if (!pendingRegisterData) {
    showMessage("authMessage", "Registration data is missing. Please request OTP again.", "error");
    return;
  }

  if (!otp) {
    showMessage("authMessage", "Please enter the OTP code.", "error");
    return;
  }

  verifyOtpBtn.disabled = true;
  verifyOtpBtn.textContent = "Verifying...";

  try {
    const verifyResponse = await apiRequest("/auth/register/verify-otp", {
      method: "POST",
      body: JSON.stringify({
        phone: pendingRegisterData.phone,
        otp
      })
    });

    const token = verifyResponse.token || verifyResponse.data?.token;
    const user = verifyResponse.user || verifyResponse.data?.user;

    if (!token || !user) {
      throw new Error("Registration verification response is incomplete.");
    }

    setSession({ token, user });
    showMessage("authMessage", "Registration completed successfully.", "success");

    setTimeout(() => {
      window.location.href = buildFrontendUrl("index.html");
    }, 700);
  } catch (error) {
    console.error("OTP verification failed:", error);
    showMessage("authMessage", error.message || "OTP verification failed.", "error");
  } finally {
    verifyOtpBtn.disabled = false;
    verifyOtpBtn.textContent = "Verify OTP";
  }
}

async function resendRegisterOtp() {
  hideMessage("authMessage");

  const resendOtpBtn = document.getElementById("resendOtpBtn");

  if (!pendingRegisterData) {
    showMessage("authMessage", "Please fill the registration form first.", "error");
    return;
  }

  resendOtpBtn.disabled = true;
  resendOtpBtn.textContent = "Resending...";

  try {
    await apiRequest("/auth/register/request-otp", {
      method: "POST",
      body: JSON.stringify(pendingRegisterData)
    });

    showMessage("authMessage", "OTP resent successfully.", "success");
  } catch (error) {
    console.error("Resend OTP failed:", error);
    showMessage("authMessage", error.message || "Failed to resend OTP.", "error");
  } finally {
    resendOtpBtn.disabled = false;
    resendOtpBtn.textContent = "Resend OTP";
  }
}