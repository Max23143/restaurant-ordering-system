async function loadDishDetails() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    document.getElementById("dishDetails").innerHTML =
      `<div class="empty-state">No dish ID was provided.</div>`;
    return;
  }

  try {
    const [itemResponse, menuResponse, reviewResponse] = await Promise.all([
      tryGet([`/menu/${id}`]),
      tryGet(["/menu", "/menu/all"]),
      tryGet([`/reviews?menuItem=${id}`, `/reviews/item/${id}`, "/reviews"])
    ]);

    const item = normalizeMenuItem(itemResponse.item || itemResponse.data || itemResponse);
    const allRaw = Array.isArray(menuResponse) ? menuResponse : menuResponse.items || menuResponse.data || [];
    const allItems = allRaw.map(normalizeMenuItem);
    const recommendations = getRecommendations(item, allItems, 4);

    renderDishDetails(item);
    renderRecommendedItems(recommendations);
    renderItemReviews(id, reviewResponse);
  } catch (error) {
    document.getElementById("dishDetails").innerHTML =
      `<div class="empty-state">Failed to load dish details. ${error.message}</div>`;
  }
}

function renderDishDetails(item) {
  document.getElementById("dishDetails").innerHTML = `
    <div class="detail-layout">
      <article class="card">
        <img src="${item.image}" alt="${item.name}" style="height: 420px; width: 100%; object-fit: cover;">
      </article>
      <section class="form-card detail-panel">
        <span class="badge">${item.category}</span>
        <h1 class="page-title">${item.name}</h1>
        <p class="page-subtitle">${item.description}</p>

        <div class="rating-row">
          <span class="stars">${renderStars(item.rating)}</span>
          <span>${item.rating.toFixed(1)} average rating</span>
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
          <button class="btn btn-primary" id="addToCartBtn">Add to Cart</button>
          <a class="btn btn-secondary" href="menu.html">Back to Menu</a>
        </div>
      </section>
    </div>
  `;

  document.getElementById("addToCartBtn").addEventListener("click", () => {
    const quantity = Number(document.getElementById("quantityInput").value || 1);
    addToCart(item, quantity);
    alert(`${quantity} x ${item.name} added to cart.`);
  });
}

function renderRecommendedItems(items) {
  const mount = document.getElementById("recommendationList");

  if (!items.length) {
    mount.innerHTML = `<div class="empty-state">No recommendations available for this dish.</div>`;
    return;
  }

  mount.innerHTML = items.map((item) => `
    <article class="card">
      <img src="${item.image}" alt="${item.name}" style="height: 200px; width: 100%; object-fit: cover;">
      <div class="card-body">
        <span class="badge">${item.category}</span>
        <h3 class="card-title">${item.name}</h3>
        <p class="card-text">${item.description}</p>
        <div class="price-row">
          <strong>${formatCurrency(item.price)}</strong>
          <a class="btn btn-secondary" href="dish-details.html?id=${item._id}">View</a>
        </div>
      </div>
    </article>
  `).join("");
}

function renderItemReviews(itemId, response) {
  const mount = document.getElementById("reviewList");
  const raw = Array.isArray(response)
    ? response
    : response.reviews || response.data || [];

  const filtered = raw.filter((review) => {
    const reviewItem = review.menuItem?._id || review.menuItem || review.itemId;
    return !reviewItem || reviewItem === itemId;
  });

  if (!filtered.length) {
    mount.innerHTML = `<div class="empty-state">No reviews yet for this dish.</div>`;
    return;
  }

  mount.innerHTML = filtered.map((review) => `
    <article class="card review-card">
      <div class="meta-row">
        <strong>${review.user?.name || review.name || "Customer"}</strong>
        <span class="stars">${renderStars(review.rating || 0)}</span>
      </div>
      <p class="card-text">${review.comment || review.reviewText || "No written comment."}</p>
      <p class="small">Posted on ${formatDate(review.createdAt)}</p>
    </article>
  `).join("");
}

document.addEventListener("DOMContentLoaded", loadDishDetails);