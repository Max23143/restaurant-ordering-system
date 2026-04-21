const API_BASE_URL =
  window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "/api";

function getFrontendBasePath() {
  const path = window.location.pathname;

  if (path.includes("/frontend/")) {
    return path.slice(0, path.indexOf("/frontend/") + "/frontend/".length);
  }

  if (path.includes("/admin/")) {
    return path.slice(0, path.indexOf("/admin/") + 1);
  }

  return path.slice(0, path.lastIndexOf("/") + 1);
}

function buildFrontendUrl(page = "") {
  return `${window.location.origin}${getFrontendBasePath()}${page}`;
}

window.getFrontendBasePath = getFrontendBasePath;
window.buildFrontendUrl = buildFrontendUrl;

function getToken() {
  return localStorage.getItem("token") || "";
}

function getCurrentUser() {
  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setSession({ token, user }) {
  if (token) localStorage.setItem("token", token);
  if (user) localStorage.setItem("user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function getUserRole() {
  const user = getCurrentUser();
  return String(user?.role || "customer").toLowerCase();
}

function redirectToLogin() {
  const currentPath = window.location.pathname.toLowerCase();

  if (currentPath.endsWith("/login.html")) return;
  if (currentPath.endsWith("/register.html")) return;

  window.location.href = buildFrontendUrl("login.html");
}

async function apiRequest(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message =
        data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`;

      if (
        response.status === 401 ||
        /invalid signature|jwt malformed|invalid token|jwt expired|token expired/i.test(message)
      ) {
        clearSession();
        redirectToLogin();
        throw new Error("Session expired. Please log in again.");
      }

      throw new Error(message);
    }

    return data;
  } catch (error) {
    if (error.name === "TypeError") {
      throw new Error("Cannot connect to backend server.");
    }
    throw error;
  }
}

async function tryGet(endpoints) {
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      return await apiRequest(endpoint);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("No working endpoint found.");
}

function showMessage(targetId, message, type = "info") {
  const el = document.getElementById(targetId);
  if (!el) {
    alert(message);
    return;
  }

  el.className = `message ${type}`;
  el.textContent = message;
  el.classList.remove("hide");
}

function hideMessage(targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;

  el.classList.add("hide");
  el.textContent = "";
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP"
  }).format(amount);
}

function formatDate(value) {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function formatDateTime(value) {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function normalizeMenuItem(item = {}) {
  return {
    _id: item._id || item.id || "",
    name: item.name || item.title || "Unnamed item",
    description: item.description || "No description available.",
    category: item.category || "General",
    image:
      item.image ||
      item.imageUrl ||
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
    price: Number(item.price || 0),
    rating: Number(item.rating || item.averageRating || 4),
    reviewsCount: Number(item.reviewsCount || item.numReviews || 0),
    isAvailable: item.isAvailable !== false,
    tags: Array.isArray(item.tags) ? item.tags : []
  };
}

function cartKey() {
  return "restaurant_cart";
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(cartKey()) || "[]");
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(cartKey(), JSON.stringify(items));
  updateCartCount();
}

function updateCartCount() {
  const count = getCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = count;
  });
}

function addToCart(menuItem, quantity = 1) {
  const item = normalizeMenuItem(menuItem);
  const cart = getCart();
  const existing = cart.find((cartItem) => cartItem._id === item._id);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ ...item, quantity });
  }

  saveCart(cart);
}

function removeFromCart(id) {
  const cart = getCart().filter((item) => item._id !== id);
  saveCart(cart);
}

function updateCartItemQuantity(id, quantity) {
  const cart = getCart().map((item) =>
    item._id === id
      ? { ...item, quantity: Math.max(1, Number(quantity || 1)) }
      : item
  );

  saveCart(cart);
}

function getCartTotal() {
  return getCart().reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
}

function renderStars(value = 0) {
  const rounded = Math.round(Number(value || 0));
  return "★".repeat(Math.max(0, rounded)) + "☆".repeat(Math.max(0, 5 - rounded));
}

document.addEventListener("DOMContentLoaded", updateCartCount);