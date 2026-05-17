/*
  This file connects the frontend suggestion search with the backend
  recommendation/search endpoint.

  The user-facing name is "Food Suggestions".
  The backend route name can still be /recommendations/search.
*/

async function fetchPreferenceRecommendations(queryInput) {
  const query =
    typeof queryInput === "string"
      ? queryInput.trim()
      : String(queryInput?.query || "").trim();

  if (!query) {
    return {
      query: "",
      count: 0,
      items: []
    };
  }

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