let allMenuItems = [];

document.addEventListener("DOMContentLoaded", () => {
  loadMenuPage();

  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const sortFilter = document.getElementById("sortFilter");
  const availabilityFilter = document.getElementById("availabilityFilter");

  if (searchInput) searchInput.addEventListener("input", applyMenuFilters);
  if (categoryFilter) categoryFilter.addEventListener("change", applyMenuFilters);
  if (sortFilter) sortFilter.addEventListener("change", applyMenuFilters);
  if (availabilityFilter) availabilityFilter.addEventListener("change", applyMenuFilters);
});

async function loadMenuPage() {
  const menuList = document.getElementById("menuList");
  if (!menuList) return;

  try {
    const response = await apiRequest("/menu");
    const rawItems = response.data || [];
    allMenuItems = rawItems.map(normalizeMenuItem);

    populateCategoryFilter(allMenuItems);
    renderMenuList(allMenuItems);
  } catch (error) {
    menuList.innerHTML = `<div class="empty-state">Failed to load menu items. ${error.message}</div>`;
  }
}

function populateCategoryFilter(items) {
  const select = document.getElementById("categoryFilter");
  if (!select) return;

  const categories = [...new Set(items.map((item) => item.category).filter(Boolean))].sort();

  select.innerHTML = `
    <option value="">All Categories</option>
    ${categories.map((category) => `<option value="${category}">${category}</option>`).join("")}
  `;
}

function applyMenuFilters() {
  const searchValue = document.getElementById("searchInput")?.value.trim().toLowerCase() || "";
  const categoryValue = document.getElementById("categoryFilter")?.value || "";
  const sortValue = document.getElementById("sortFilter")?.value || "ratingDesc";
  const availabilityOnly = document.getElementById("availabilityFilter")?.checked || false;

  let filtered = [...allMenuItems].filter((item) => {
    const matchesSearch =
      !searchValue ||
      item.name.toLowerCase().includes(searchValue) ||
      item.description.toLowerCase().includes(searchValue) ||
      item.category.toLowerCase().includes(searchValue);

    const matchesCategory = !categoryValue || item.category === categoryValue;
    const matchesAvailability = !availabilityOnly || item.isAvailable;

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  switch (sortValue) {
    case "priceAsc":
      filtered.sort((a, b) => a.price - b.price);
      break;
    case "priceDesc":
      filtered.sort((a, b) => b.price - a.price);
      break;
    case "nameAsc":
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "ratingDesc":
    default:
      filtered.sort((a, b) => b.rating - a.rating);
      break;
  }

  renderMenuList(filtered);
}

function renderMenuList(items) {
  const mount = document.getElementById("menuList");
  if (!mount) return;

  if (!items.length) {
    mount.innerHTML = `<div class="empty-state">No menu items match your search.</div>`;
    return;
  }

  mount.innerHTML = items.map((item) => `
    <article class="card">
      <img
        src="${item.image}"
        alt="${item.name}"
        style="height: 220px; width: 100%; object-fit: cover;"
      >
      <div class="card-body">
        <div class="meta-row">
          <span class="badge">${item.category}</span>
          <span class="badge ${item.isAvailable ? "badge-success" : "badge-muted"}">
            ${item.isAvailable ? "Available" : "Unavailable"}
          </span>
        </div>

        <h3 class="card-title">${item.name}</h3>
        <p class="card-text">${item.description}</p>

        <div class="rating-row">
          <span class="stars">${renderStars(item.rating)}</span>
          <span class="small">${item.rating.toFixed(1)}</span>
        </div>

        <div class="price-row">
          <strong>${formatCurrency(item.price)}</strong>
          <div class="inline-actions">
            <a class="btn btn-secondary" href="${buildFrontendUrl(`dish-details.html?id=${item._id}`)}">Details</a>
            <button class="btn btn-primary" onclick="handleMenuAddToCart('${item._id}')">Add</button>
          </div>
        </div>
      </div>
    </article>
  `).join("");
}

function handleMenuAddToCart(id) {
  const item = allMenuItems.find((menuItem) => menuItem._id === id);
  if (!item) return;

  if (!item.isAvailable) {
    alert("This item is currently unavailable.");
    return;
  }

  addToCart(item, 1);
  alert(`${item.name} added to cart.`);
}