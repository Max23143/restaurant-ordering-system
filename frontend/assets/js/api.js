/*
  API CONFIGURATION FILE

  This file controls how the frontend connects to the backend API.

  Local development:
  - If the frontend is running on localhost/127.0.0.1, it uses local backend:
    http://127.0.0.1:5000/api

  Deployed frontend:
  - If the frontend is running on Cloudflare, it uses the Render backend:
    https://restaurant-ordering-backend-vmw0.onrender.com/api

  Important:
  - The old code used only localhost.
  - That caused "Failed to fetch" on Cloudflare because Cloudflare users cannot access your local PC backend.
*/

const LOCAL_API_BASE_URL = "http://127.0.0.1:5000/api";
const DEPLOYED_API_BASE_URL = "https://restaurant-ordering-backend-vmw0.onrender.com/api";

/*
  Checks whether the frontend is running locally or deployed online.
*/
const isLocalFrontend =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

/*
  Reads optional custom API URL from localStorage.

  Safety fix:
  - If the website is deployed online but localStorage still has localhost saved,
    we remove it because it would break Cloudflare deployment.
*/
function getStoredApiBaseUrl() {
  const storedApiBaseUrl = localStorage.getItem("apiBaseUrl") || "";

  const storedUrlIsLocalhost =
    storedApiBaseUrl.includes("127.0.0.1") ||
    storedApiBaseUrl.includes("localhost");

  if (!isLocalFrontend && storedUrlIsLocalhost) {
    localStorage.removeItem("apiBaseUrl");
    return "";
  }

  return storedApiBaseUrl;
}

/*
  Final backend API URL used by every fetch request.

  Priority:
  1. window.RESTAURANT_API_BASE_URL, if manually set
  2. localStorage apiBaseUrl, if saved
  3. Local backend if running locally
  4. Render backend if running online
*/
const API_BASE_URL = (
  window.RESTAURANT_API_BASE_URL ||
  getStoredApiBaseUrl() ||
  (isLocalFrontend ? LOCAL_API_BASE_URL : DEPLOYED_API_BASE_URL)
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

/*
  Builds correct frontend page links.

  This helps the project work in:
  - local folder structure
  - GitHub Pages style paths
  - Cloudflare deployment root
*/
function buildFrontendUrl(fileName) {
  const currentPath = window.location.pathname;
  const frontendRoot = "/restaurant-ordering-system/frontend/";
  const simpleFrontendRoot = "/frontend/";

  if (currentPath.includes(frontendRoot)) {
    const base = currentPath.substring(
      0,
      currentPath.indexOf(frontendRoot) + frontendRoot.length
    );
    return `${base}${fileName}`;
  }

  if (currentPath.includes(simpleFrontendRoot)) {
    const base = currentPath.substring(
      0,
      currentPath.indexOf(simpleFrontendRoot) + simpleFrontendRoot.length
    );
    return `${base}${fileName}`;
  }

  return `/${fileName}`;
}

/*
  Normalizes menu item data from MongoDB/backend.

  This prevents frontend errors when some fields are missing.
*/
function normalizeMenuItem(item = {}) {
  return {
    _id: item._id || item.id || "",
    name: item.name || "Unnamed Item",
    description: item.description || "No description available.",
    category: item.category || "General",
    cuisine: item.cuisine || "",
    flavours: Array.isArray(item.flavours) ? item.flavours : [],
    price: Number(item.price || 0),
    image:
      item.image ||
      item.imageUrl ||
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
    isAvailable: item.isAvailable !== false,
    ratingAverage: Number(item.ratingAverage || 0),
    ratingCount: Number(item.ratingCount || 0),
    tags: Array.isArray(item.tags) ? item.tags : [],
    recommendationScore: Number(item.recommendationScore || 0),
    matchedTerms: Array.isArray(item.matchedTerms) ? item.matchedTerms : []
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

/*
  Safe GET helper.

  Used mainly by admin dashboard so one failed request does not break everything.
*/
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

/*
  Main API request function.

  Every frontend file uses this to communicate with the backend.

  It automatically:
  - Adds JSON headers
  - Adds JWT token if user is logged in
  - Converts backend JSON response
  - Shows useful errors
  - Clears invalid/expired token
*/
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
    console.error("Network error:", networkError);
    console.error("API_BASE_URL being used:", API_BASE_URL);
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

    /*
      If token is broken/expired, clear login data.
      This avoids repeated JWT errors.
    */
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

/*
  Cart functions.

  Cart is stored in localStorage before the final order is sent to backend.
*/
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

  const totalItems = getCart().reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  cartCountElements.forEach((element) => {
    element.textContent = totalItems;
  });
}