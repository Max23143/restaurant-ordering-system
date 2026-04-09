let allMenuItems = [];

async function loadMenuPage() {
  try {
    const response = await tryGet(["/menu", "/menu/all"]);
    const rawItems = Array.isArray(response) ? response : response.items || response.data || [];
    allMenuItems = rawItems.map(normalizeMenuItem);
    populateCategoryFilter(allMenuItems);
    renderMenuList(allMenuItems);
  } catch (error) {
    document.getElementById("menuList").innerHTML =
      `<div class="empty-state">Failed to load menu items. ${error.message}</div>`;
  }
}

function populateCategoryFilter(items) {
  const categories = [...new Set(items.map((item) => item.category))].sort();
  const select = document.getElementById("categoryFilter");
  select.innerHTML = `<option value="">All Categories</option>` +
    categories.map((category) => `<option value="${category}">${category}</option>`).join("");
}

function renderMenuList(items) {
  const mount = document.getElementById("menuList");

  if (!items.length) {
    mount.innerHTML = `<div class="empty-state">No menu items match your search.</div>`;
    return;
  }

  mount.innerHTML = items.map((item) => `
    <article class="card">
      <img src="${item.image}" alt="${item.name}" style="height: 220px; width: 100%; object-fit: cover;">
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
            <a class="btn btn-secondary" href="dish-details.html?id=${item._id}">Details</a>
            <button class="btn btn-primary" onclick='handleMenuAddToCart(${JSON.stringify(item).replace(/'/g, "&apos;")})'>Add</button>
          </div>
        </div>
      </div>
    </article>
  `).join("");
}

function handleMenuAddToCart(item) {
  addToCart(item, 1);
  alert(`${item.name} added to cart.`);
}

function applyMenuFilters() {
  const searchValue = document.getElementById("searchInput").value.trim().toLowerCase();
  const categoryValue = document.getElementById("categoryFilter").value;
  const sortValue = document.getElementById("sortFilter").value;
  const availabilityOnly = document.getElementById("availabilityFilter").checked;

  let filtered = [...allMenuItems].filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchValue) ||
      item.description.toLowerCase().includes(searchValue);

    const matchesCategory = !categoryValue || item.category === categoryValue;
    const matchesAvailability = !availabilityOnly || item.isAvailable;

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  if (sortValue === "priceAsc") filtered.sort((a, b) => a.price - b.price);
  if (sortValue === "priceDesc") filtered.sort((a, b) => b.price - a.price);
  if (sortValue === "ratingDesc") filtered.sort((a, b) => b.rating - a.rating);
  if (sortValue === "nameAsc") filtered.sort((a, b) => a.name.localeCompare(b.name));

  renderMenuList(filtered);
}

document.addEventListener("DOMContentLoaded", () => {
  loadMenuPage();

  ["searchInput", "categoryFilter", "sortFilter", "availabilityFilter"].forEach((id) => {
    document.getElementById(id).addEventListener("input", applyMenuFilters);
    document.getElementById(id).addEventListener("change", applyMenuFilters);
  });
});