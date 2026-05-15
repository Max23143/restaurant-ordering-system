document.addEventListener("DOMContentLoaded", () => {
  loadMyReviews();
});

async function loadMyReviews() {
  const mount = document.getElementById("myReviewsContainer") || document.getElementById("reviewsContainer");
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