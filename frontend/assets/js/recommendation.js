async function fetchTopRatedRecommendations() {
  const response = await apiRequest("/recommendations/top-rated");
  return (response.data || []).map(normalizeMenuItem);
}

async function fetchPersonalizedRecommendations() {
  const response = await apiRequest("/recommendations/personalized");
  return {
    items: (response.data || []).map(normalizeMenuItem)
  };
}

async function fetchPreferenceRecommendations(queryInput) {
  const query =
    typeof queryInput === "string"
      ? queryInput.trim()
      : String(queryInput?.query || "").trim();

  const response = await apiRequest(
    `/recommendations/search?query=${encodeURIComponent(query)}`
  );

  return {
    query,
    count: (response.data || []).length,
    items: (response.data || []).map(normalizeMenuItem)
  };
}

async function addRecommendedItemToCart(id) {
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