let reviewMenuItems = [];
let myReviews = [];

document.addEventListener("DOMContentLoaded", initReviewsPage);

async function initReviewsPage() {
  try {
    const menuResponse = await apiRequest("/menu");
    reviewMenuItems = (menuResponse.data || []).map(normalizeMenuItem);
    populateReviewMenu(reviewMenuItems);
  } catch (error) {
    document.getElementById("myReviews").innerHTML =
      `<div class="empty-state">Unable to load menu items. ${error.message}</div>`;
  }

  if (getToken()) {
    await loadMyReviews();
  } else {
    document.getElementById("myReviews").innerHTML =
      `<div class="empty-state">Log in to view and manage your reviews.</div>`;
  }

  const reviewForm = document.getElementById("reviewForm");
  if (reviewForm) {
    reviewForm.addEventListener("submit", submitReview);
  }
}

function populateReviewMenu(items) {
  const select = document.getElementById("reviewMenuItem");
  if (!select) return;

  select.innerHTML = `
    <option value="">Select a dish</option>
    ${items.map((item) => `<option value="${item._id}">${item.name}</option>`).join("")}
  `;
}

async function loadMyReviews() {
  const mount = document.getElementById("myReviews");
  if (!mount) return;

  try {
    const response = await apiRequest("/reviews/my-reviews");
    myReviews = response.data || [];
    renderMyReviews(myReviews);
  } catch (error) {
    mount.innerHTML = `<div class="empty-state">Unable to load your reviews. ${error.message}</div>`;
  }
}

function renderMyReviews(reviews) {
  const mount = document.getElementById("myReviews");
  if (!mount) return;

  if (!reviews.length) {
    mount.innerHTML = `<div class="empty-state">You have not submitted any reviews yet.</div>`;
    return;
  }

  mount.innerHTML = reviews.map((review) => `
    <article class="card review-card">
      <div class="meta-row">
        <strong>${review.menuItem?.name || "Menu Item"}</strong>
        <span class="stars">${renderStars(review.rating || 0)}</span>
      </div>

      <p class="card-text">${review.comment || "No comment provided."}</p>

      <div class="price-row">
        <span class="small">Posted on ${formatDate(review.createdAt)}</span>
        <div class="inline-actions">
          <button class="btn btn-secondary" onclick="openEditReview('${review._id}')">Edit</button>
          <button class="btn btn-danger" onclick="deleteReview('${review._id}')">Delete</button>
        </div>
      </div>
    </article>
  `).join("");
}

async function submitReview(event) {
  event.preventDefault();
  hideMessage("reviewMessage");

  if (!getToken()) {
    showMessage("reviewMessage", "Please log in before submitting a review.", "error");
    setTimeout(() => {
      window.location.href = buildFrontendUrl("login.html");
    }, 700);
    return;
  }

  const reviewBtn = document.getElementById("reviewBtn");
  const menuItem = document.getElementById("reviewMenuItem").value;
  const rating = Number(document.getElementById("rating").value);
  const comment = document.getElementById("comment").value.trim();

  if (!menuItem || !rating) {
    showMessage("reviewMessage", "Menu item and rating are required.", "error");
    return;
  }

  reviewBtn.disabled = true;
  reviewBtn.textContent = "Submitting...";

  try {
    await apiRequest("/reviews", {
      method: "POST",
      body: JSON.stringify({
        menuItem,
        rating,
        comment
      })
    });

    showMessage("reviewMessage", "Review submitted successfully.", "success");
    document.getElementById("reviewForm").reset();
    await loadMyReviews();
  } catch (error) {
    showMessage("reviewMessage", error.message || "Review submission failed.", "error");
  } finally {
    reviewBtn.disabled = false;
    reviewBtn.textContent = "Submit Review";
  }
}

function openEditReview(reviewId) {
  const review = myReviews.find((item) => item._id === reviewId);
  if (!review) return;

  const newRating = prompt("Enter new rating (1 to 5):", review.rating);
  if (newRating === null) return;

  const numericRating = Number(newRating);
  if (numericRating < 1 || numericRating > 5) {
    alert("Rating must be between 1 and 5.");
    return;
  }

  const newComment = prompt("Update your comment:", review.comment || "");
  if (newComment === null) return;

  updateReview(reviewId, numericRating, newComment);
}

async function updateReview(reviewId, rating, comment) {
  try {
    await apiRequest(`/reviews/${reviewId}`, {
      method: "PUT",
      body: JSON.stringify({
        rating,
        comment
      })
    });

    alert("Review updated successfully.");
    await loadMyReviews();
  } catch (error) {
    alert(error.message || "Failed to update review.");
  }
}

async function deleteReview(reviewId) {
  const confirmed = confirm("Are you sure you want to delete this review?");
  if (!confirmed) return;

  try {
    await apiRequest(`/reviews/${reviewId}`, {
      method: "DELETE"
    });

    alert("Review deleted successfully.");
    await loadMyReviews();
  } catch (error) {
    alert(error.message || "Failed to delete review.");
  }
}