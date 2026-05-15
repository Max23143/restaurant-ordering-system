document.addEventListener("DOMContentLoaded", () => {
  setupReviewForm();
  loadReviewMenuItems();
  loadMyReviews();
});

function setupReviewForm() {
  const form = document.getElementById("reviewForm");
  if (!form) return;

  form.addEventListener("submit", submitReview);
}

async function loadReviewMenuItems() {
  const select = document.getElementById("reviewMenuItem");
  if (!select) return;

  select.innerHTML = `<option value="">Loading menu items...</option>`;

  try {
    const response = await apiRequest("/menu");
    const items = (response.data || []).map(normalizeMenuItem).filter((item) => item.isAvailable);

    if (!items.length) {
      select.innerHTML = `<option value="">No menu items available</option>`;
      return;
    }

    select.innerHTML = `
      <option value="">Select a menu item</option>
      ${items.map((item) => `<option value="${item._id}">${item.name}</option>`).join("")}
    `;
  } catch (error) {
    select.innerHTML = `<option value="">Unable to load menu items</option>`;
    showMessage("reviewMessage", error.message || "Unable to load menu items.", "error");
  }
}

async function submitReview(event) {
  event.preventDefault();
  hideMessage("reviewMessage");

  if (!getToken()) {
    showMessage("reviewMessage", "Please log in before submitting a review.", "error");
    return;
  }

  const button = document.getElementById("reviewBtn");
  const payload = {
    menuItem: document.getElementById("reviewMenuItem")?.value || "",
    rating: Number(document.getElementById("rating")?.value || 0),
    comment: document.getElementById("comment")?.value.trim() || ""
  };

  if (!payload.menuItem || !payload.rating) {
    showMessage("reviewMessage", "Please choose a dish and rating.", "error");
    return;
  }

  if (button) {
    button.disabled = true;
    button.textContent = "Submitting Review...";
  }

  try {
    await apiRequest("/reviews", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    event.target.reset();
    showMessage("reviewMessage", "Review submitted successfully. It will appear publicly after admin approval.", "success");
    loadMyReviews();
  } catch (error) {
    showMessage("reviewMessage", error.message || "Unable to submit review.", "error");
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Submit Review";
    }
  }
}

async function loadMyReviews() {
  const mount = document.getElementById("myReviews") || document.getElementById("myReviewsContainer") || document.getElementById("reviewsContainer");
  if (!mount) return;

  if (!getToken()) {
    mount.innerHTML = `<div class="empty-state">Please log in to view your reviews.</div>`;
    return;
  }

  try {
    const response = await apiRequest("/reviews/my-reviews");
    const reviews = response.data || [];

    if (!reviews.length) {
      mount.innerHTML = `<div class="empty-state">You have not submitted any reviews yet.</div>`;
      return;
    }

    mount.innerHTML = reviews.map((review) => `
      <article class="card" style="margin-bottom: 1rem;">
        <div class="card-body">
          <h3 class="card-title">${review.menuItem?.name || "Review"}</h3>
          <p class="card-text">
            <strong>Date:</strong> ${formatDate(review.createdAt)}<br>
            <strong>Rating:</strong> ${review.rating || 0}/5<br>
            <strong>Approved:</strong> ${review.isApproved ? "Yes" : "Pending"}<br>
            <strong>Comment:</strong> ${review.comment || "No comment"}
          </p>
        </div>
      </article>
    `).join("");
  } catch (error) {
    mount.innerHTML = `<div class="empty-state">Unable to load your reviews. ${error.message}</div>`;
  }
}
