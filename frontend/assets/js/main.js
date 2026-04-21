function getNavLinks(isLoggedIn = false, role = "customer") {
  const links = [
    { file: "index.html", label: "Home" },
    { file: "menu.html", label: "Menu" }
  ];

  if (isLoggedIn && role !== "admin") {
    links.push({ file: "booking.html", label: "Booking" });
    links.push({ file: "reviews.html", label: "Reviews" });
    links.push({ file: "order-history.html", label: "My Orders" });
  }

  if (role === "admin") {
    links.push({ file: "admin/dashboard.html", label: "Admin Dashboard" });
    links.push({ file: "admin/menu.html", label: "Admin Menu" });
    links.push({ file: "admin/orders.html", label: "Admin Orders" });
    links.push({ file: "admin/bookings.html", label: "Admin Bookings" });
    links.push({ file: "admin/reviews.html", label: "Admin Reviews" });
  }

  if (!isLoggedIn) {
    links.push({ file: "login.html", label: "Login" });
    links.push({ file: "register.html", label: "Register" });
  }

  return links;
}

function isLinkActive(file) {
  const pathname = window.location.pathname.toLowerCase();
  return pathname.endsWith(`/${file.toLowerCase()}`) || pathname.endsWith(file.toLowerCase());
}

function renderNavbar() {
  const mount = document.getElementById("navbar");
  if (!mount) return;

  const currentUser = getCurrentUser();
  const isLoggedIn = !!currentUser;
  const role = getUserRole();

  const links = getNavLinks(isLoggedIn, role)
    .map((link) => {
      const href = buildFrontendUrl(link.file);
      const activeClass = isLinkActive(link.file) ? "active" : "";
      return `<a href="${href}" class="${activeClass}">${link.label}</a>`;
    })
    .join("");

  const cartLink = isLoggedIn && role !== "admin"
    ? `
      <a href="${buildFrontendUrl("cart.html")}" class="${isLinkActive("cart.html") ? "active" : ""}">
        Cart (<span data-cart-count>0</span>)
      </a>
    `
    : "";

  const authBlock = isLoggedIn
    ? `
      <span class="badge badge-muted">Hi, ${currentUser.fullName || currentUser.name || currentUser.email || "User"}</span>
      <button class="btn btn-secondary" id="logoutBtn">Logout</button>
    `
    : "";

  mount.innerHTML = `
    <header class="topbar">
      <div class="container nav">
        <a class="brand" href="${buildFrontendUrl("index.html")}">RestaurantHub</a>
        <nav class="nav-links">
          ${links}
          ${cartLink}
          ${authBlock}
        </nav>
      </div>
    </header>
  `;

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearSession();
      window.location.href = buildFrontendUrl("login.html");
    });
  }

  updateCartCount();
}

function renderFooter() {
  const mount = document.getElementById("footer");
  if (!mount) return;

  mount.innerHTML = `
    <footer class="footer">
      <div class="container">
        <p>RestaurantHub Final Year Project Frontend &copy; 2026</p>
      </div>
    </footer>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  renderNavbar();
  renderFooter();
});