document.addEventListener("DOMContentLoaded", () => {
  initializeHomePage();
});

async function initializeHomePage() {
  await loadHomeOffers();
  await loadFeaturedItems();
}

/*
  Home offers:
  - loads active offers from database
  - shows latest added offers first
  - shows image if available
*/
async function loadHomeOffers() {
  const mount = document.getElementById("homeOffersContainer");
  if (!mount) return;

  try {
    const response = await apiRequest("/events-offers?type=offer");
    const offers = response.data || [];

    if (!offers.length) {
      mount.innerHTML = `<div class="empty-state">No offers available right now.</div>`;
      return;
    }

    mount.innerHTML = offers.slice(0, 3).map(renderHomeOfferCard).join("");
  } catch (error) {
    mount.innerHTML = `<div class="empty-state">Failed to load offers. ${error.message}</div>`;
  }
}

function renderHomeOfferCard(offer) {
  return `
    <article class="offer-card">
      ${offer.image ? `<img src="${offer.image}" alt="${offer.title}" class="offer-card-image">` : ""}
      <div class="offer-card-body">
        <span class="badge badge-success">${offer.discountLabel || "Offer"}</span>
        <h3>${offer.title}</h3>
        <p>${offer.description}</p>
        ${offer.dateLabel ? `<p><strong>Available:</strong> ${offer.dateLabel}</p>` : ""}
      </div>
    </article>
  `;
}

async function loadFeaturedItems() {
  const mount = document.getElementById("featuredItems");
  if (!mount) return;

  try {
    const response = await apiRequest("/menu");
    const items = (response.data || [])
      .map(normalizeMenuItem)
      .filter((item) => item.isAvailable)
      .slice(0, 8);

    if (!items.length) {
      mount.innerHTML = `<div class="empty-state">No featured dishes available.</div>`;
      return;
    }

    mount.innerHTML = items.map(renderHomeMenuCard).join("");
  } catch (error) {
    mount.innerHTML = `<div class="empty-state">Failed to load featured dishes. ${error.message}</div>`;
  }
}

function renderHomeMenuCard(item) {
  return `
    <article class="card">
      <img src="${item.image}" alt="${item.name}" style="height:220px;width:100%;object-fit:cover;">
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
            <button class="btn btn-primary" onclick="addHomeItemToCart('${item._id}')">Add</button>
          </div>
        </div>
      </div>
    </article>
  `;
}

async function addHomeItemToCart(id) {
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