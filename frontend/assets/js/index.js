document.addEventListener("DOMContentLoaded", () => {
  loadHomePage();

  const searchBtn = document.getElementById("recommendationSearchBtn");
  const searchInput = document.getElementById("recommendationSearchInput");

  if (searchBtn) {
    searchBtn.addEventListener("click", handleRecommendationSearch);
  }

  if (searchInput) {
    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleRecommendationSearch();
      }
    });
  }

  document.querySelectorAll(".recommendation-tag-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const query = button.dataset.query || "";
      const input = document.getElementById("recommendationSearchInput");

      if (input) {
        input.value = query;
      }

      handleRecommendationSearch();
    });
  });
});

async function loadHomePage() {
  const featuredContainer = document.getElementById("featuredItems");
  const recommendedContainer = document.getElementById("recommendedItems");

  if (!featuredContainer || !recommendedContainer) return;

  try {
    const menuResponse = await apiRequest("/menu");
    const menuItems = (menuResponse.data || []).map(normalizeMenuItem);

    const featured = [...menuItems]
      .filter((item) => item.isAvailable)
      .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
      .slice(0, 4);

    featuredContainer.innerHTML = renderHomeCards(
      featured,
      "No featured dishes available."
    );

    let recommendedItems = [];
    let recommendationMessage = "";

    if (getToken()) {
      try {
        const personalizedResponse = await fetchPersonalizedRecommendations();
        recommendedItems = personalizedResponse.items || [];
        recommendationMessage = personalizedResponse.message || "";
      } catch {
        recommendedItems = await fetchTopRatedRecommendations();
      }
    } else {
      recommendedItems = await fetchTopRatedRecommendations();
    }

    window.__recommendationItems = recommendedItems;

    recommendedContainer.innerHTML = `
      ${recommendationMessage ? `<div class="message info">${recommendationMessage}</div>` : ""}
      <div class="grid grid-4">
        ${renderRecommendationCards(recommendedItems, "No recommendations available.")}
      </div>
    `;
  } catch (error) {
    featuredContainer.innerHTML = `
      <div class="empty-state">
        Unable to load featured dishes. ${error.message}
      </div>
    `;

    recommendedContainer.innerHTML = `
      <div class="empty-state">
        Unable to load recommendations. ${error.message}
      </div>
    `;
  }
}

async function handleRecommendationSearch() {
  const input = document.getElementById("recommendationSearchInput");
  const resultsMount = document.getElementById("searchRecommendationResults");

  if (!input || !resultsMount) return;

  const query = input.value.trim();

  if (!query) {
    resultsMount.innerHTML = `
      <div class="empty-state">
        Enter a food preference like spicy, sweet, grilled, cheesy, chicken, or vegetarian.
      </div>
    `;
    return;
  }

  resultsMount.innerHTML = `
    <div class="empty-state">
      Loading recommendations...
    </div>
  `;

  try {
    const items = await fetchPreferenceRecommendations(query);
    window.__recommendationItems = items;

    resultsMount.innerHTML = renderRecommendationCards(
      items,
      `No recommendations found for "${query}".`
    );
  } catch (error) {
    resultsMount.innerHTML = `
      <div class="empty-state">
        Failed to load recommendations. ${error.message}
      </div>
    `;
  }
}

function renderHomeCards(items, emptyMessage) {
  if (!items.length) {
    return `<div class="empty-state">${emptyMessage}</div>`;
  }

  return items.map((item) => `
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
          <span class="small">
            ${Number(item.rating || 0).toFixed(1)} (${item.reviewsCount || 0} reviews)
          </span>
        </div>

        <div class="price-row">
          <strong>${formatCurrency(item.price)}</strong>
          <div class="inline-actions">
            <a class="btn btn-secondary" href="${buildFrontendUrl(`dish-details.html?id=${item._id}`)}">View</a>
            <button class="btn btn-primary" onclick="handleFeaturedAddToCart('${item._id}')">Add</button>
          </div>
        </div>
      </div>
    </article>
  `).join("");
}

function handleFeaturedAddToCart(id) {
  apiRequest(`/menu/${id}`)
    .then((response) => {
      const item = normalizeMenuItem(response.data || {});

      if (!item.isAvailable) {
        alert("This item is currently unavailable.");
        return;
      }

      addToCart(item, 1);
      alert(`${item.name} added to cart.`);
    })
    .catch((error) => {
      alert(error.message || "Unable to add item.");
    });
}