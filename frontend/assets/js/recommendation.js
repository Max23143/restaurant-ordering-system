async function fetchTopRatedRecommendations() {
  const response = await apiRequest("/recommendations/top-rated");
  return (response.data || []).map(normalizeRecommendationItem);
}

async function fetchMenuBasedRecommendations(menuItemId) {
  const response = await apiRequest(`/recommendations/menu/${menuItemId}`);
  return (response.data || []).map(normalizeRecommendationItem);
}

async function fetchPersonalizedRecommendations() {
  const response = await apiRequest("/recommendations/personalized");
  return {
    personalized: response.personalized === true,
    message: response.message || "",
    items: (response.data || []).map(normalizeRecommendationItem)
  };
}

async function fetchPreferenceRecommendations(query) {
  const response = await apiRequest(`/recommendations/search?query=${encodeURIComponent(query)}`);
  return {
    query: response.query || query,
    count: Number(response.count || 0),
    items: (response.data || []).map(normalizeRecommendationItem)
  };
}

function normalizeRecommendationItem(item = {}) {
  return {
    _id: item._id || item.id || "",
    name: item.name || "Unnamed item",
    description: item.description || "No description available.",
    category: item.category || "General",
    image:
      item.image ||
      item.imageUrl ||
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
    price: Number(item.price || 0),
    rating: Number(item.ratingAverage || item.rating || 0),
    reviewsCount: Number(item.ratingCount || item.reviewsCount || 0),
    isAvailable: item.isAvailable !== false,
    tags: Array.isArray(item.tags) ? item.tags : [],
    recommendationScore: Number(item.recommendationScore || 0)
  };
}

function getRecommendationHint(item) {
  const tags = (item.tags || []).map((tag) => String(tag).toLowerCase());

  if (tags.includes("vegetarian") || tags.includes("veg")) return "Vegetarian match";
  if (tags.includes("vegan")) return "Vegan-friendly option";
  if (tags.includes("spicy")) return "Spicy match";
  if (tags.includes("dessert") || tags.includes("sweet")) return "Dessert / sweet match";
  if (tags.includes("chicken")) return "Chicken match";
  if (tags.includes("fish") || tags.includes("seafood")) return "Seafood match";
  if (tags.includes("healthy")) return "Healthy choice";
  return "Relevant result";
}

function renderRecommendationCards(items = [], emptyMessage = "No recommendations available.") {
  if (!items.length) {
    return `<div class="empty-state">${emptyMessage}</div>`;
  }

  return items.map((item) => `
    <article class="card recommendation-result-card">
      <img
        src="${item.image}"
        alt="${item.name}"
        class="recommendation-result-image"
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

        <div class="recommendation-tags-row">
          <span class="recommendation-match-chip">${getRecommendationHint(item)}</span>
          <span class="recommendation-score-chip">Score ${item.recommendationScore.toFixed(1)}</span>
        </div>

        <div class="rating-row">
          <span class="stars">${renderStars(item.rating)}</span>
          <span class="small">${Number(item.rating || 0).toFixed(1)} (${item.reviewsCount} reviews)</span>
        </div>

        <div class="price-row">
          <strong>${formatCurrency(item.price)}</strong>
          <div class="inline-actions">
            <a class="btn btn-secondary" href="${buildFrontendUrl(`dish-details.html?id=${item._id}`)}">View</a>
            <button class="btn btn-primary" onclick="addRecommendedItemToCart('${item._id}')">Add</button>
          </div>
        </div>
      </div>
    </article>
  `).join("");
}

function addRecommendedItemToCart(id) {
  const recommendationSource = window.__recommendationItems || [];
  const item = recommendationSource.find((entry) => entry._id === id);

  if (!item) {
    alert("Unable to add this item right now.");
    return;
  }

  if (!item.isAvailable) {
    alert("This item is currently unavailable.");
    return;
  }

  addToCart(item, 1);
  alert(`${item.name} added to cart.`);
}