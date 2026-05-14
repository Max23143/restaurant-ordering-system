const API_BASE_URL = "http://172.20.10.5:5000/api";

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

  if (currentPath.includes(frontendRoot)) {
    const base = currentPath.substring(0, currentPath.indexOf(frontendRoot) + frontendRoot.length);
    return `${base}${fileName}`;
  }

  if (currentPath.includes("/frontend/")) {
    const base = currentPath.substring(0, currentPath.indexOf("/frontend/") + "/frontend/".length);
    return `${base}${fileName}`;
  }

  return `/${fileName}`;
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

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  let data = null;
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = { message: text };
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`
    );
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