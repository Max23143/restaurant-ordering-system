document.addEventListener("DOMContentLoaded", () => {
  loadAdminDashboard();
});

async function loadAdminDashboard() {
  const mount = document.getElementById("adminDashboardContainer") || document.getElementById("dashboardContainer");
  if (!mount) return;

  try {
    const [menuResult, ordersResult, bookingsResult, reviewsResult] = await Promise.all([
      tryGet("/menu", []),
      tryGet("/orders/admin/all", []),
      tryGet("/bookings/admin/all", []),
      tryGet("/reviews/admin/all", [])
    ]);

    const totalMenu = menuResult.data.length;
    const totalOrders = ordersResult.data.length;
    const totalBookings = bookingsResult.data.length;
    const totalReviews = reviewsResult.data.length;

    mount.innerHTML = `
      <div class="grid grid-4">
        <article class="card"><div class="card-body"><h3 class="card-title">Menu Items</h3><p class="card-text">${totalMenu}</p></div></article>
        <article class="card"><div class="card-body"><h3 class="card-title">Orders</h3><p class="card-text">${totalOrders}</p></div></article>
        <article class="card"><div class="card-body"><h3 class="card-title">Bookings</h3><p class="card-text">${totalBookings}</p></div></article>
        <article class="card"><div class="card-body"><h3 class="card-title">Reviews</h3><p class="card-text">${totalReviews}</p></div></article>
      </div>
    `;
  } catch (error) {
    mount.innerHTML = `<div class="empty-state">Failed to load dashboard data. ${error.message}</div>`;
  }
}