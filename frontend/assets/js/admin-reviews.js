document.addEventListener("DOMContentLoaded", () => {
  if (!protectAdminReviewsPage()) return;

  document.getElementById("refreshReviewsBtn").addEventListener("click", loadAdminReviews);
  document.getElementById("reviewApprovalFilter").addEventListener("change", loadAdminReviews);

  loadAdminReviews();
});

function protectAdminReviewsPage() {
  const currentUser = getCurrentUser();

  if (!currentUser || !getToken()) {
    window.location.href = buildFrontendUrl("login.html");
    return false;
  }

  if (getUserRole() !== "admin") {
    window.location.href = buildFrontendUrl("index.html");
    return false;
  }

  return true;
}

async function loadAdminReviews() {
  const mount = document.getElementById("adminReviewsList");
  if (!mount) return;

  const approved = document.getElementById("reviewApprovalFilter").value;
  const endpoint = approved === ""
    ? "/reviews/admin/all"
    : `/reviews/admin/all?approved=${approved}`;

  try {
    const response = await apiRequest(endpoint);
    const reviews = response.data || [];

    if (!reviews.length) {
      mount.innerHTML = `<div class="empty-state">No reviews found.</div>`;
      return;
    }

    mount.innerHTML = reviews.map((review) => `
      <article class="card review-card">
        <div class="meta-row">
          <strong>${review.user?.fullName || "Customer"}</strong>
          <span class="badge">${review.menuItem?.name || "Menu Item"}</span>
        </div>

        <div class="rating-row">
          <span class="stars">${renderStars(review.rating || 0)}</span>
          <span class="small">${review.isApproved ? "Approved" : "Not Approved"}</span>
        </div>

        <p class="card-text">${review.comment || "No comment provided."}</p>

        <div class="price-row">
          <span class="small">Posted on ${formatDate(review.createdAt)}</span>
          <button class="btn btn-secondary" onclick="toggleReviewApproval('${review._id}')">
            ${review.isApproved ? "Unapprove" : "Approve"}
          </button>
        </div>
      </article>
    `).join("");
  } catch (error) {
    mount.innerHTML = `<div class="empty-state">Failed to load reviews. ${error.message}</div>`;
  }
}

async function toggleReviewApproval(reviewId) {
  try {
    await apiRequest(`/reviews/admin/${reviewId}/approval`, {
      method: "PUT"
    });

    showMessage("adminReviewMessage", "Review approval updated successfully.", "success");
    loadAdminReviews();
  } catch (error) {
    showMessage("adminReviewMessage", error.message || "Failed to update review approval.", "error");
  }
}