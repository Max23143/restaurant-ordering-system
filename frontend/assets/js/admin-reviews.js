document.addEventListener("DOMContentLoaded", () => {
  loadAdminReviews();

  const refreshBtn = document.getElementById("refreshReviewsBtn");
  const filter = document.getElementById("reviewApprovalFilter");

  if (refreshBtn) refreshBtn.addEventListener("click", loadAdminReviews);
  if (filter) filter.addEventListener("change", loadAdminReviews);
});

async function loadAdminReviews() {
  const mount = document.getElementById("adminReviewsList") || document.getElementById("adminReviewsTable");
  const filter = document.getElementById("reviewApprovalFilter") || document.getElementById("reviewStatusFilter");

  if (!mount) return;

  try {
    const query = new URLSearchParams();
    if (filter?.value) query.append("approved", filter.value);

    const endpoint = query.toString()
      ? `/reviews/admin/all?${query.toString()}`
      : "/reviews/admin/all";

    const response = await apiRequest(endpoint);
    const reviews = response.data || [];

    if (!reviews.length) {
      mount.innerHTML = `<div class="empty-state">No reviews found.</div>`;
      return;
    }

    mount.innerHTML = reviews.map((review) => `
      <article class="card" style="margin-bottom:1rem;">
        <div class="card-body">
          <h3 class="card-title">${review.menuItem?.name || "Review"}</h3>
          <p class="card-text">
            <strong>User:</strong> ${review.user?.fullName || "N/A"}<br>
            <strong>Date:</strong> ${formatDate(review.createdAt)}<br>
            <strong>Rating:</strong> ${review.rating || 0}/5<br>
            <strong>Approved:</strong> ${review.isApproved ? "Yes" : "No"}<br>
            <strong>Comment:</strong> ${review.comment || "No comment"}
          </p>
          <button class="btn btn-secondary" onclick="toggleAdminReviewApproval('${review._id}')">
            ${review.isApproved ? "Unapprove" : "Approve"}
          </button>
        </div>
      </article>
    `).join("");
  } catch (error) {
    mount.innerHTML = `<div class="empty-state">Failed to load reviews. ${error.message}</div>`;
  }
}

async function toggleAdminReviewApproval(id) {
  try {
    await apiRequest(`/reviews/admin/${id}/approval`, { method: "PUT" });
    loadAdminReviews();
  } catch (error) {
    alert(error.message || "Failed to update review approval.");
  }
}
