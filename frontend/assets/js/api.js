const API_BASE_URL = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
  ? "http://localhost:5000/api"
  : "/api";

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

function parseJwt(token) {
  if (!token || token.split(".").length !== 3) return null;

  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => "%" + ("00" + char.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getUserRole() {
  const user = getCurrentUser();
  if (user?.role) return user.role;

  const payload = parseJwt(getToken());
  return payload?.role || payload?.isAdmin ? "admin" : "customer";
}

async function apiRequest(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

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
    throw new Error(message);
  }

  return data;
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
  if (!el) return;

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
    image: item.image || item.imageUrl || "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
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
    item._id === id ? { ...item, quantity: Math.max(1, Number(quantity || 1)) } : item
  );
  saveCart(cart);
}

function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function renderStars(value = 0) {
  const rounded = Math.round(Number(value || 0));
  return "★".repeat(Math.max(0, rounded)) + "☆".repeat(Math.max(0, 5 - rounded));
}

document.addEventListener("DOMContentLoaded", updateCartCount);