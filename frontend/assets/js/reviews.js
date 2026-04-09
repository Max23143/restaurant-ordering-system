let reviewMenuItems = [];

async function initReviewsPage() {
  try {
    const [menuResponse, reviewResponse] = await Promise.all([
      tryGet(["/menu", "/menu/all"]),
      tryGet(["/reviews"])
    ]);

    reviewMenuItems = (Array.isArray(menuResponse) ? menuResponse : menuResponse.items || menuResponse.data || [])
      .map(normalizeMenuItem);

    populateReviewMenu(reviewMenuItems);
    renderReviews(reviewResponse);
  } catch (error) {
    document.getElementById("publicReviews").innerHTML =
      `<div class="empty-state">Unable to load reviews. ${error.message}</div>`;
  }

  document.getElementById("reviewForm").addEventListener("submit", submitReview);
}

function populateReviewMenu(items) {
  const select = document.getElementById("reviewMenuItem");
  select.innerHTML = `<option value="">Select a dish</option>` +
    items.map((item) => `<option value="${item._id}">${item.name}</option>`).join("");
}

function renderReviews(response) {
  const mount = document.getElementById("publicReviews");
  const reviews = Array.isArray(response) ? response : response.reviews || response.data || [];

  if (!reviews.length) {
    mount.innerHTML = `<div class="empty-state">No reviews have been posted yet.</div>`;
    return;
  }

  mount.innerHTML = reviews.map((review) => {
    const itemId = review.menuItem?._id || review.menuItem || "";
    const itemName =
      review.menuItem?.name ||
      review.itemName ||
      reviewMenuItems.find((item) => item._id === itemId)?.name ||
      "Menu Item";

    return `
      <article class="card review-card">
        <div class="meta-row">
          <strong>${review.user?.name || review.name || "Customer"}</strong>
          <span class="badge">${itemName}</span>
        </div>
        <div class="rating-row">
          <span class="stars">${renderStars(review.rating || 0)}</span>
          <span class="small">${formatDate(review.createdAt)}</span>
        </div>
        <p class="card-text">${review.comment || review.reviewText || ""}</p>
      </article>
    `;
  }).join("");
}

async function submitReview(event) {
  event.preventDefault();

  if (!getToken()) {
    alert("Please log in before submitting a review.");
    window.location.href = "login.html";
    return;
  }

  hideMessage("reviewMessage");

  const payload = {
    menuItem: document.getElementById("reviewMenuItem").value,
    rating: Number(document.getElementById("rating").value),
    comment: document.getElementById("comment").value.trim()
  };

  try {
    await apiRequest("/reviews", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    showMessage("reviewMessage", "Review submitted successfully.", "success");
    event.target.reset();

    const refreshed = await tryGet(["/reviews"]);
    renderReviews(refreshed);
  } catch (error) {
    showMessage("reviewMessage", error.message, "error");
  }
}

document.addEventListener("DOMContentLoaded", initReviewsPage);