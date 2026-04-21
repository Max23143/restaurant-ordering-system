let currentDish = null;
let allDishItems = [];

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
    const [itemResponse, menuResponse, reviewResponse] = await Promise.all([
      apiRequest(`/menu/${id}`),
      apiRequest("/menu"),
      apiRequest(`/reviews/menu/${id}`)
    ]);

    currentDish = normalizeMenuItem(itemResponse.data || {});
    allDishItems = (menuResponse.data || []).map(normalizeMenuItem);

    renderDishDetails(currentDish);
    renderRecommendedItems(getRecommendedItems(currentDish, allDishItems));
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

function getRecommendedItems(baseItem, items) {
  return items
    .filter((item) => item._id !== baseItem._id)
    .sort((a, b) => getRecommendationScore(baseItem, b) - getRecommendationScore(baseItem, a))
    .slice(0, 4);
}

function getRecommendationScore(baseItem, candidate) {
  let score = 0;

  if (baseItem.category === candidate.category) score += 5;
  if (candidate.isAvailable) score += 2;
  score += Number(candidate.rating || 0);

  const baseWords = `${baseItem.name} ${baseItem.description} ${(baseItem.tags || []).join(" ")}`.toLowerCase();
  const candidateWords = `${candidate.name} ${candidate.description} ${(candidate.tags || []).join(" ")}`.toLowerCase();

  const keywords = ["spicy", "cheese", "grill", "fried", "sweet", "chicken", "beef", "veggie", "dessert", "drink"];
  keywords.forEach((keyword) => {
    if (baseWords.includes(keyword) && candidateWords.includes(keyword)) {
      score += 1;
    }
  });

  return score;
}

function renderRecommendedItems(items) {
  const mount = document.getElementById("recommendationList");
  if (!mount) return;

  if (!items.length) {
    mount.innerHTML = `<div class="empty-state">No recommendations available for this dish.</div>`;
    return;
  }

  mount.innerHTML = items.map((item) => `
    <article class="card">
      <img
        src="${item.image}"
        alt="${item.name}"
        style="height: 200px; width: 100%; object-fit: cover;"
      >
      <div class="card-body">
        <span class="badge">${item.category}</span>
        <h3 class="card-title">${item.name}</h3>
        <p class="card-text">${item.description}</p>
        <div class="price-row">
          <strong>${formatCurrency(item.price)}</strong>
          <a class="btn btn-secondary" href="${buildFrontendUrl(`dish-details.html?id=${item._id}`)}">View</a>
        </div>
      </div>
    </article>
  `).join("");
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