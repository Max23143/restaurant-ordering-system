function getNavLinks(basePath = "") {
  return [
    { href: `${basePath}index.html`, label: "Home" },
    { href: `${basePath}menu.html`, label: "Menu" },
    { href: `${basePath}cart.html`, label: "Cart" },
    { href: `${basePath}booking.html`, label: "Booking" },
    { href: `${basePath}reviews.html`, label: "Reviews" },
    { href: `${basePath}order-history.html`, label: "My Orders" },
    { href: `${basePath}login.html`, label: "Login" }
  ];
}

function renderNavbar(basePath = "") {
  const mount = document.getElementById("navbar");
  if (!mount) return;

  const path = window.location.pathname.split("/").pop() || "index.html";
  const links = getNavLinks(basePath)
    .map(
      (link) => `
        <a href="${link.href}" class="${path === link.href.split("/").pop() ? "active" : ""}">
          ${link.label}
        </a>
      `
    )
    .join("");

  const role = getUserRole();
  const currentUser = getCurrentUser();
  const adminLink =
    role === "admin"
      ? `<a href="${basePath}admin/dashboard.html">Admin</a>`
      : "";

  const authBlock = currentUser
    ? `
      <span class="badge badge-muted">Hi, ${currentUser.fullName || currentUser.name || currentUser.email || "User"}</span>
      <button class="btn btn-secondary" id="logoutBtn">Logout</button>
    `
    : `<a href="${basePath}register.html">Register</a>`;

  mount.innerHTML = `
    <header class="topbar">
      <div class="container nav">
        <a class="brand" href="${basePath}index.html">RestaurantHub</a>
        <nav class="nav-links">
          ${links}
          ${adminLink}
          <a href="${basePath}cart.html">Cart (<span data-cart-count>0</span>)</a>
          ${authBlock}
        </nav>
      </div>
    </header>
  `;

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearSession();
      window.location.href = `${basePath}login.html`;
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
  const isAdminPage = window.location.pathname.includes("/admin/");
  renderNavbar(isAdminPage ? "../" : "");
  renderFooter();
});