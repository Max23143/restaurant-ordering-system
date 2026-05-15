const API_BASE_URL = (
  window.RESTAURANT_API_BASE_URL ||
  localStorage.getItem("apiBaseUrl") ||
  "http://127.0.0.1:5000/api"
).replace(/\/$/, "");

function getToken() {
  return localStorage.getItem("token") || "";
}

function getCurrentUser() {
  const rawUser = localStorage.getItem("user");
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser);
  } catch (error) {
    console.error("Failed to parse current user:", error);
    return null;
  }
}

function getUserRole() {
  const user = getCurrentUser();
  return user?.role || "customer";
}

function setSession({ token, user }) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function buildFrontendUrl(fileName) {
  const currentPath = window.location.pathname;
  const frontendRoot = "/restaurant-ordering-system/frontend/";
  const simpleFrontendRoot = "/frontend/";

  if (currentPath.includes(frontendRoot)) {
    const base = currentPath.substring(0, currentPath.indexOf(frontendRoot) + frontendRoot.length);
    return `${base}${fileName}`;
  }

  if (currentPath.includes(simpleFrontendRoot)) {
    const base = currentPath.substring(0, currentPath.indexOf(simpleFrontendRoot) + simpleFrontendRoot.length);
    return `${base}${fileName}`;
  }

  return `/${fileName}`;
}

function normalizeMenuItem(item = {}) {
  return {
    _id: item._id || item.id || "",
    name: item.name || "Unnamed Item",
    description: item.description || "No description available.",
    category: item.category || "General",
    price: Number(item.price || 0),
    image:
      item.image ||
      item.imageUrl ||
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
    isAvailable: item.isAvailable !== false,
    ratingAverage: Number(item.ratingAverage || 0),
    ratingCount: Number(item.ratingCount || 0),
    tags: Array.isArray(item.tags) ? item.tags : [],
    cuisine: item.cuisine || "",
    isVegetarian: Boolean(item.isVegetarian),
    isVegan: Boolean(item.isVegan)
  };
}

function formatDateTime(value) {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDate(value) {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

async function tryGet(endpoint, fallback = []) {
  try {
    const response = await apiRequest(endpoint);
    return {
      success: true,
      data: response.data || fallback,
      raw: response
    };
  } catch (error) {
    console.error(`GET failed for ${endpoint}:`, error);
    return {
      success: false,
      data: fallback,
      error
    };
  }
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

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });
  } catch (networkError) {
    throw new Error("Failed to fetch");
  }

  let data = null;
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = { message: text };
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`;

    const lower = String(message).toLowerCase();
    if (
      lower.includes("invalid signature") ||
      lower.includes("jwt malformed") ||
      lower.includes("invalid token") ||
      lower.includes("token expired")
    ) {
      clearSession();
    }

    throw new Error(message);
  }

  return data;
}

function showMessage(elementId, message, type = "info") {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.className = `message ${type}`;
  element.textContent = message;
  element.classList.remove("hide");
}

function hideMessage(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.textContent = "";
  element.className = "message hide";
}

function formatCurrency(amount) {
  return `£${Number(amount || 0).toFixed(2)}`;
}

function renderStars(rating = 0) {
  const rounded = Math.round(Number(rating || 0));
  let stars = "";

  for (let i = 1; i <= 5; i += 1) {
    stars += i <= rounded ? "★" : "☆";
  }

  return stars;
}

function getCart() {
  const raw = localStorage.getItem("cart");
  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to parse cart:", error);
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function addToCart(item, quantity = 1) {
  const cart = getCart();
  const existingItem = cart.find((entry) => entry._id === item._id);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      _id: item._id,
      name: item.name,
      price: Number(item.price || 0),
      image: item.image || item.imageUrl || "",
      description: item.description || "",
      quantity
    });
  }

  saveCart(cart);
}

function updateCartItemQuantity(itemId, quantity) {
  const cart = getCart().map((item) => {
    if (item._id === itemId) {
      return {
        ...item,
        quantity: Math.max(1, Number(quantity || 1))
      };
    }
    return item;
  });

  saveCart(cart);
}

function removeFromCart(itemId) {
  const cart = getCart().filter((item) => item._id !== itemId);
  saveCart(cart);
}

function getCartTotal() {
  return getCart().reduce((total, item) => {
    return total + Number(item.price || 0) * Number(item.quantity || 0);
  }, 0);
}

function updateCartCount() {
  const cartCountElements = document.querySelectorAll("[data-cart-count]");
  const totalItems = getCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  cartCountElements.forEach((element) => {
    element.textContent = totalItems;
  });
}