async function loadHomePage() {
  const featuredContainer = document.getElementById("featuredItems");
  const recommendedContainer = document.getElementById("recommendedItems");

  try {
    const response = await tryGet(["/menu", "/menu/all"]);
    const rawItems = Array.isArray(response) ? response : response.items || response.data || [];
    const items = rawItems.map(normalizeMenuItem);

    const featured = [...items]
      .filter((item) => item.isAvailable)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 4);

    featuredContainer.innerHTML = featured.map(renderMenuCard).join("");

    const currentUser = getCurrentUser();
    const preferredCategory = currentUser?.preferredCategory || "";
    const recommendations = getPersonalizedHomeRecommendations(items, preferredCategory);

    recommendedContainer.innerHTML = recommendations.map(renderMenuCard).join("");
  } catch (error) {
    featuredContainer.innerHTML = `<div class="empty-state">Unable to load featured dishes.</div>`;
    recommendedContainer.innerHTML = `<div class="empty-state">Unable to load recommendations.</div>`;
  }
}

function renderMenuCard(item) {
  return `
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
          <span class="small">${item.rating.toFixed(1)} (${item.reviewsCount} reviews)</span>
        </div>
        <div class="price-row">
          <strong>${formatCurrency(item.price)}</strong>
          <div class="inline-actions">
            <a class="btn btn-secondary" href="dish-details.html?id=${item._id}">View</a>
            <button class="btn btn-primary" onclick='handleAddToCart(${JSON.stringify(item).replace(/'/g, "&apos;")})'>
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function handleAddToCart(item) {
  addToCart(item, 1);
  alert(`${item.name} added to cart.`);
}

document.addEventListener("DOMContentLoaded", loadHomePage);