let currentDish = null;
let currentRecommendations = [];

document.addEventListener("DOMContentLoaded", loadDishDetails);

async function loadDishDetails() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const detailsMount = document.getElementById("dishDetails");
  if (!detailsMount) return;

  if (!id) {
    detailsMount.innerHTML = `<div class="empty-state">No dish ID was provided.</div>`;
    return;
  }

  try {
    const [itemResponse, recommendationResponse, reviewResponse] = await Promise.all([
      apiRequest(`/menu/${id}`),
      fetchMenuBasedRecommendations(id),
      apiRequest(`/reviews/menu/${id}`)
    ]);

    currentDish = normalizeMenuItem(itemResponse.data || {});
    currentRecommendations = recommendationResponse;

    renderDishDetails(currentDish);
    renderRecommendedItems(currentRecommendations);
    renderDishReviews(reviewResponse.data || []);
  } catch (error) {
    detailsMount.innerHTML = `<div class="empty-state">Failed to load dish details. ${error.message}</div>`;
  }
}

function renderDishDetails(item) {
  const mount = document.getElementById("dishDetails");
  if (!mount) return;

  mount.innerHTML = `
    <div class="detail-layout">
      <article class="card">
        <img
          src="${item.image}"
          alt="${item.name}"
          style="height: 420px; width: 100%; object-fit: cover;"
        >
      </article>

      <section class="form-card detail-panel">
        <span class="badge">${item.category}</span>
        <h1 class="page-title">${item.name}</h1>
        <p class="page-subtitle">${item.description}</p>

        <div class="rating-row">
          <span class="stars">${renderStars(item.rating)}</span>
          <span>${Number(item.rating || 0).toFixed(1)} average rating</span>
        </div>

        <div class="price-row">
          <strong style="font-size: 1.5rem;">${formatCurrency(item.price)}</strong>
          <span class="badge ${item.isAvailable ? "badge-success" : "badge-muted"}">
            ${item.isAvailable ? "Available now" : "Currently unavailable"}
          </span>
        </div>

        <div class="form-group" style="margin-top: 1rem;">
          <label for="quantityInput">Quantity</label>
          <input type="number" id="quantityInput" min="1" value="1">
        </div>

        <div class="form-actions" style="margin-top: 1rem;">
          <button class="btn btn-primary" id="addToCartBtn" ${item.isAvailable ? "" : "disabled"}>Add to Cart</button>
          <a class="btn btn-secondary" href="${buildFrontendUrl("menu.html")}">Back to Menu</a>
        </div>
      </section>
    </div>
  `;

  const addBtn = document.getElementById("addToCartBtn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const quantity = Number(document.getElementById("quantityInput")?.value || 1);

      if (quantity < 1) {
        alert("Quantity must be at least 1.");
        return;
      }

      addToCart(item, quantity);
      alert(`${quantity} x ${item.name} added to cart.`);
    });
  }
}

function renderRecommendedItems(items) {
  const mount = document.getElementById("recommendationList");
  if (!mount) return;

  window.__recommendationItems = items;
  mount.innerHTML = renderRecommendationCards(items, "No recommendations available for this dish.");
}

function renderDishReviews(reviews) {
  const mount = document.getElementById("reviewList");
  if (!mount) return;

  if (!reviews.length) {
    mount.innerHTML = `<div class="empty-state">No reviews yet for this dish.</div>`;
    return;
  }

  mount.innerHTML = reviews.map((review) => `
    <article class="card review-card">
      <div class="meta-row">
        <strong>${review.user?.fullName || review.fullName || review.name || "Customer"}</strong>
        <span class="stars">${renderStars(review.rating || 0)}</span>
      </div>
      <p class="card-text">${review.comment || "No written comment."}</p>
      <p class="small">Posted on ${formatDate(review.createdAt)}</p>
    </article>
  `).join("");
}