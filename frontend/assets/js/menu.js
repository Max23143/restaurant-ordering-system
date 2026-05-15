document.addEventListener("DOMContentLoaded", () => {
  loadMenuItems();
});

async function loadMenuItems() {
  const menuContainer = document.getElementById("menuContainer");
  const categoryFilter = document.getElementById("categoryFilter");
  const searchInput = document.getElementById("menuSearchInput");
  const sortFilter = document.getElementById("sortFilter");
  const availableOnly = document.getElementById("availableOnly");

  if (!menuContainer) return;

  try {
    const response = await apiRequest("/menu");
    const items = (response.data || []).map(normalizeMenuItem);

    populateCategoryFilter(items, categoryFilter);

    const applyFilters = () => {
      let filteredItems = [...items];

      const selectedCategory = categoryFilter?.value?.trim().toLowerCase() || "all";
      const searchText = searchInput?.value?.trim().toLowerCase() || "";
      const sortValue = sortFilter?.value || "";
      const availableOnlyChecked = availableOnly?.checked || false;

      if (selectedCategory !== "all") {
        filteredItems = filteredItems.filter(
          (item) => String(item.category).toLowerCase() === selectedCategory
        );
      }

      if (searchText) {
        filteredItems = filteredItems.filter((item) => {
          const combined = `
            ${item.name}
            ${item.description}
            ${item.category}
            ${(item.tags || []).join(" ")}
          `.toLowerCase();

          return combined.includes(searchText);
        });
      }

      if (availableOnlyChecked) {
        filteredItems = filteredItems.filter((item) => item.isAvailable);
      }

      if (sortValue === "rating") {
        filteredItems.sort((a, b) => b.ratingAverage - a.ratingAverage);
      } else if (sortValue === "priceLowHigh") {
        filteredItems.sort((a, b) => a.price - b.price);
      } else if (sortValue === "priceHighLow") {
        filteredItems.sort((a, b) => b.price - a.price);
      } else if (sortValue === "nameAZ") {
        filteredItems.sort((a, b) => a.name.localeCompare(b.name));
      }

      renderMenuItems(filteredItems, menuContainer);
    };

    if (categoryFilter) categoryFilter.addEventListener("change", applyFilters);
    if (searchInput) searchInput.addEventListener("input", applyFilters);
    if (sortFilter) sortFilter.addEventListener("change", applyFilters);
    if (availableOnly) availableOnly.addEventListener("change", applyFilters);

    applyFilters();
  } catch (error) {
    console.error("Menu loading error:", error);
    menuContainer.innerHTML = `
      <div class="empty-state">
        Failed to load menu items. ${error.message}
      </div>
    `;
  }
}

function populateCategoryFilter(items, categoryFilter) {
  if (!categoryFilter) return;

  const categories = [...new Set(items.map((item) => String(item.category || "General")))].sort();

  categoryFilter.innerHTML = `
    <option value="all">All Categories</option>
    ${categories
      .map((category) => `<option value="${category.toLowerCase()}">${category}</option>`)
      .join("")}
  `;
}

function renderMenuItems(items, container) {
  if (!items.length) {
    container.innerHTML = `<div class="empty-state">No menu items found.</div>`;
    return;
  }

  container.innerHTML = items.map((item) => `
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
          <span class="stars">${renderStars(item.ratingAverage)}</span>
          <span class="small">${item.ratingAverage.toFixed(1)} (${item.ratingCount} reviews)</span>
        </div>

        <div class="price-row">
          <strong>${formatCurrency(item.price)}</strong>
          <div class="inline-actions">
            <a class="btn btn-secondary" href="${buildFrontendUrl(`dish-details.html?id=${item._id}`)}">View</a>
            <button class="btn btn-primary" onclick="addMenuItemToCart('${item._id}')">Add</button>
          </div>
        </div>
      </div>
    </article>
  `).join("");
}

async function addMenuItemToCart(id) {
  try {
    const response = await apiRequest(`/menu/${id}`);
    const item = normalizeMenuItem(response.data || {});

    if (!item._id) {
      alert("Item not found.");
      return;
    }

    if (!item.isAvailable) {
      alert("This item is currently unavailable.");
      return;
    }

    addToCart(item, 1);
    alert(`${item.name} added to cart.`);
  } catch (error) {
    alert(error.message || "Failed to add item to cart.");
  }
}