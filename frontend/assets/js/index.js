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
      .map(normalizeMenuItem)
      .filter((item) => item.isAvailable)
      .slice(0, 8);

    if (!items.length) {
      mount.innerHTML = `<div class="empty-state">No featured dishes available.</div>`;
      return;
    }

    mount.innerHTML = items.map((item) => renderHomeMenuCard(item)).join("");
  } catch (error) {
    console.error("Featured items error:", error);
    mount.innerHTML = `<div class="empty-state">Failed to load featured dishes. ${error.message}</div>`;
  }
}

async function loadRecommendedItems() {
  const mount = document.getElementById("recommendedItems");
  if (!mount) return;

  try {
    let items = [];

    if (getToken()) {
      const personalized = await fetchPersonalizedRecommendations();
      items = personalized.items || [];
    } else {
      items = await fetchTopRatedRecommendations();
    }

    if (!items.length) {
      mount.innerHTML = `<div class="empty-state">No recommendations available.</div>`;
      return;
    }

    mount.innerHTML = items.map((item) => renderHomeMenuCard(item, true)).join("");
  } catch (error) {
    console.error("Recommended items error:", error);
    mount.innerHTML = `<div class="empty-state">Failed to load recommendations. ${error.message}</div>`;
  }
}

function renderHomeMenuCard(item, recommended = false) {
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
          <span class="stars">${renderStars(item.ratingAverage)}</span>
          <span class="small">${item.ratingAverage.toFixed(1)} (${item.ratingCount} reviews)</span>
        </div>

        <div class="price-row">
          <strong>${formatCurrency(item.price)}</strong>
          <div class="inline-actions">
            <a class="btn btn-secondary" href="${buildFrontendUrl(`dish-details.html?id=${item._id}`)}">View</a>
            <button class="btn btn-primary" onclick="${recommended ? `addRecommendedItemToCart('${item._id}')` : `addHomeItemToCart('${item._id}')`}">Add</button>
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

async function setupRecommendationSearch() {
  const input = document.getElementById("recommendationSearchInput");
  const button = document.getElementById("recommendationSearchBtn");
  const resultMount = document.getElementById("searchRecommendationResults");
  const metaMount = document.getElementById("recommendationSearchMeta");
  const quickButtons = document.querySelectorAll(".recommendation-tag-btn");

  if (!input || !button || !resultMount || !metaMount) return;

  const handleSearch = async (queryText) => {
    const query = String(queryText || input.value || "").trim();

    if (!query) {
      metaMount.classList.add("hide");
      resultMount.innerHTML = `<div class="empty-state">Enter a search phrase to get recommendations.</div>`;
      return;
    }

    button.disabled = true;
    button.textContent = "Searching...";

    try {
      input.value = query;

      const response = await fetchPreferenceRecommendations(query);

      metaMount.classList.remove("hide");
      metaMount.innerHTML = `
        <div class="recommendation-meta-card">
          <strong>Search:</strong> "${response.query}"
          <span class="recommendation-meta-divider">•</span>
          <strong>Results:</strong> ${response.count}
        </div>
      `;

      if (!response.items.length) {
        resultMount.innerHTML = `<div class="empty-state">No dishes matched "${response.query}".</div>`;
      } else {
        resultMount.innerHTML = response.items.map((item) => renderHomeMenuCard(item, true)).join("");
      }
    } catch (error) {
      console.error("Recommendation search error:", error);
      metaMount.classList.add("hide");
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