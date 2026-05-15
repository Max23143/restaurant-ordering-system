document.addEventListener("DOMContentLoaded", () => {
  loadAdminReviews();

  const refreshBtn = document.getElementById("refreshReviewsBtn");
  if (refreshBtn) refreshBtn.addEventListener("click", loadAdminReviews);
});

async function loadAdminReviews() {
  const mount = document.getElementById("adminReviewsContainer") || document.getElementById("reviewsContainer");
  const filter = document.getElementById("reviewStatusFilter");

  if (!mount) return;

  try {
    const response = await apiRequest("/reviews/admin/all");
    let reviews = response.data || [];

    if (filter?.value) {
      const selected = filter.value.toLowerCase();
      reviews = reviews.filter((review) => {
        const approved = Boolean(review.isApproved);
        if (selected === "approved") return approved;
        if (selected === "pending") return !approved;
        return true;
      });
    }

    if (!reviews.length) {
      mount.innerHTML = `<div class="empty-state">No reviews found.</div>`;
      return;
    }

    mount.innerHTML = reviews.map((review) => `
      <article class="card" style="margin-bottom: 1rem;">
        <div class="card-body">
          <h3 class="card-title">${review.user?.fullName || "User Review"}</h3>
          <p class="card-text">
            <strong>Date:</strong> ${formatDate(review.createdAt)}<br>
            <strong>Rating:</strong> ${review.rating || 0}/5<br>
            <strong>Approved:</strong> ${review.isApproved ? "Yes" : "No"}<br>
            <strong>Comment:</strong> ${review.comment || "No comment"}
          </p>
        </div>
      </article>
    `).join("");
  } catch (error) {
    mount.innerHTML = `<div class="empty-state">Failed to load reviews. ${error.message}</div>`;
  }
}