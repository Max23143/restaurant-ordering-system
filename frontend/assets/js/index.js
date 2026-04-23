document.addEventListener("DOMContentLoaded", () => {
  initializeHomePage();
});

async function initializeHomePage() {
  await Promise.all([
    loadFeaturedItems(),
    loadRecommendedItems(),
    setupRecommendationSearch()
  ]);
}

async function loadFeaturedItems() {
  const mount = document.getElementById("featuredItems");
  if (!mount) return;

  try {
    const response = await apiRequest("/menu");
    const items = (response.data || [])
      .filter((item) => item.isAvailable !== false)
      .slice(0, 8);

    if (!items.length) {
      mount.innerHTML = `<div class="empty-state">No featured dishes available.</div>`;
      return;
    }

    const duplicatedItems = [...items, ...items];

    mount.innerHTML = duplicatedItems.map((item, index) => renderFeaturedCard(item, index >= items.length)).join("");
  } catch (error) {
    mount.innerHTML = `<div class="empty-state">Failed to load featured dishes. ${error.message}</div>`;
  }
}

function renderFeaturedCard(item, isClone = false) {
  const image =
    item.image ||
    item.imageUrl ||
    "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80";

  const ratingAverage = Number(item.ratingAverage || 0);
  const ratingCount = Number(item.ratingCount || 0);

  return `
    <article class="card featured-dish-card ${isClone ? "featured-clone" : ""}">
      <img
        src="${image}"
        alt="${item.name || "Dish"}"
        class="featured-dish-image"
      >

      <div class="card-body">
        <div class="meta-row">
          <span class="badge">${item.category || "General"}</span>
          <span class="badge ${item.isAvailable !== false ? "badge-success" : "badge-muted"}">
            ${item.isAvailable !== false ? "Available" : "Unavailable"}
          </span>
        </div>

        <h3 class="card-title">${item.name || "Unnamed Dish"}</h3>
        <p class="card-text">${item.description || "No description available."}</p>

        <div class="rating-row">
          <span class="stars">${renderStars(ratingAverage)}</span>
          <span class="small">${ratingAverage.toFixed(1)} (${ratingCount} reviews)</span>
        </div>

        <div class="price-row">
          <strong>${formatCurrency(item.price || 0)}</strong>
          <div class="inline-actions">
            <a class="btn btn-secondary" href="${buildFrontendUrl(`dish-details.html?id=${item._id}`)}">View</a>
            <button class="btn btn-primary" onclick="addFeaturedItemToCart('${item._id}')">Add</button>
          </div>
        </div>
      </div>
    </article>
  `;
}

async function loadRecommendedItems() {
  const mount = document.getElementById("recommendedItems");
  if (!mount) return;

  try {
    if (getToken()) {
      const personalized = await fetchPersonalizedRecommendations();

      window.__recommendationItems = personalized.items || [];

      mount.innerHTML = `
        ${personalized.message ? `<div class="message info">${personalized.message}</div>` : ""}
        <div class="grid grid-4">
          ${renderRecommendationCards(personalized.items || [], "No recommendations available.")}
        </div>
      `;
      return;
    }

    const topRated = await fetchTopRatedRecommendations();
    window.__recommendationItems = topRated || [];

    mount.innerHTML = `
      <div class="grid grid-4">
        ${renderRecommendationCards(topRated || [], "No recommendations available.")}
      </div>
    `;
  } catch (error) {
    mount.innerHTML = `<div class="empty-state">Failed to load recommendations. ${error.message}</div>`;
  }
}

async function setupRecommendationSearch() {
  const input = document.getElementById("recommendationSearchInput");
  const button = document.getElementById("recommendationSearchBtn");
  const resultMount = document.getElementById("searchRecommendationResults");
  const quickButtons = document.querySelectorAll(".recommendation-tag-btn");

  if (!input || !button || !resultMount) return;

  const handleSearch = async (queryText) => {
    const query = String(queryText || input.value || "").trim();

    if (!query) {
      resultMount.innerHTML = `<div class="empty-state">Enter a search phrase to get recommendations.</div>`;
      return;
    }

    button.disabled = true;
    button.textContent = "Searching...";

    try {
      input.value = query;

      const items = await fetchPreferenceRecommendations(query);
      window.__recommendationItems = items || [];

      resultMount.innerHTML = renderRecommendationCards(
        items || [],
        "No dishes matched your preference."
      );
    } catch (error) {
      resultMount.innerHTML = `<div class="empty-state">Failed to load recommendations. ${error.message}</div>`;
    } finally {
      button.disabled = false;
      button.textContent = "Find Recommendations";
    }
  };

  button.addEventListener("click", () => handleSearch());

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch();
    }
  });

  quickButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const query = btn.dataset.query || "";
      handleSearch(query);
    });
  });
}

async function addFeaturedItemToCart(id) {
  try {
    const response = await apiRequest(`/menu/${id}`);
    const item = response.data;

    if (!item) {
      alert("Item not found.");
      return;
    }

    if (item.isAvailable === false) {
      alert("This item is currently unavailable.");
      return;
    }

    addToCart(item, 1);
    alert(`${item.name} added to cart.`);
  } catch (error) {
    alert(error.message || "Failed to add item to cart.");
  }
}