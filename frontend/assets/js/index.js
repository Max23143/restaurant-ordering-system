document.addEventListener("DOMContentLoaded", () => {
  initializeHomePage();
});

async function initializeHomePage() {
  await loadFeaturedItems();
  setupFoodSuggestionSearch();
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

function setupFoodSuggestionSearch() {
  const input = document.getElementById("suggestionSearchInput");
  const button = document.getElementById("suggestionSearchBtn");
  const typedText = document.getElementById("typedSuggestionText");
  const resultMount = document.getElementById("foodSuggestionResults");

  if (!input || !button || !typedText || !resultMount) return;

  let typingTimer = null;

  /*
    This function shows what the user typed and then asks the backend
    for matching food suggestions.
  */
  const handleSuggestionSearch = async () => {
    const query = input.value.trim();

    if (!query) {
      typedText.classList.add("hide");
      resultMount.innerHTML = `<div class="empty-state">Type something to see food suggestions.</div>`;
      return;
    }

    typedText.classList.remove("hide");
    typedText.innerHTML = `
      <div class="recommendation-meta-card">
        <strong>You typed:</strong> "${query}"
      </div>
    `;

    if (query.length < 2) {
      resultMount.innerHTML = `<div class="empty-state">Keep typing to get better suggestions.</div>`;
      return;
    }

    button.disabled = true;
    button.textContent = "Searching...";

    try {
      const response = await fetchPreferenceRecommendations(query);

      if (!response.items.length) {
        resultMount.innerHTML = `<div class="empty-state">No food suggestions found for "${query}". Try another word.</div>`;
        return;
      }

      resultMount.innerHTML = response.items
        .map((item) => renderHomeMenuCard(item))
        .join("");
    } catch (error) {
      resultMount.innerHTML = `<div class="empty-state">Failed to load suggestions. ${error.message}</div>`;
    } finally {
      button.disabled = false;
      button.textContent = "Show Suggestions";
    }
  };

  /*
    Live typing suggestion:
    The search runs after the user stops typing for 500ms.
  */
  input.addEventListener("input", () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(handleSuggestionSearch, 500);
  });

  button.addEventListener("click", handleSuggestionSearch);

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSuggestionSearch();
    }
  });

  resultMount.innerHTML = `<div class="empty-state">Type your food preference to see suggestions.</div>`;
}