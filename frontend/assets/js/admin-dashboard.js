document.addEventListener("DOMContentLoaded", () => {
  loadAdminDashboard();
});

async function loadAdminDashboard() {
  const statsMount = document.getElementById("adminStats");
  const ordersMount = document.getElementById("recentOrders");
  const bookingsMount = document.getElementById("recentBookings");
  const reviewsMount = document.getElementById("recentReviews");

  if (!statsMount && !ordersMount && !bookingsMount && !reviewsMount) return;

  try {
    const [menuResult, ordersResult, bookingsResult, reviewsResult] = await Promise.all([
      tryGet("/menu", []),
      tryGet("/orders/admin/all", []),
      tryGet("/bookings/admin/all", []),
      tryGet("/reviews/admin/all", [])
    ]);

    const menuItems = menuResult.data || [];
    const orders = ordersResult.data || [];
    const bookings = bookingsResult.data || [];
    const reviews = reviewsResult.data || [];

    if (statsMount) {
      statsMount.innerHTML = `
        <article class="card"><div class="card-body"><h3 class="card-title">Menu Items</h3><p class="card-text">${menuItems.length}</p></div></article>
        <article class="card"><div class="card-body"><h3 class="card-title">Orders</h3><p class="card-text">${orders.length}</p></div></article>
        <article class="card"><div class="card-body"><h3 class="card-title">Bookings</h3><p class="card-text">${bookings.length}</p></div></article>
        <article class="card"><div class="card-body"><h3 class="card-title">Reviews</h3><p class="card-text">${reviews.length}</p></div></article>
      `;
    }

    renderRecentOrders(ordersMount, orders.slice(0, 5));
    renderRecentBookings(bookingsMount, bookings.slice(0, 5));
    renderRecentReviews(reviewsMount, reviews.slice(0, 5));
  } catch (error) {
    const message = `<div class="empty-state">Failed to load dashboard data. ${error.message}</div>`;
    if (statsMount) statsMount.innerHTML = message;
  }
}

function renderRecentOrders(mount, orders) {
  if (!mount) return;
  if (!orders.length) {
    mount.innerHTML = `<div class="empty-state">No recent orders.</div>`;
    return;
  }

  mount.innerHTML = orders.map((order) => `
    <article class="card" style="margin-bottom:1rem;">
      <div class="card-body">
        <h3 class="card-title">Order ${order._id}</h3>
        <p class="card-text">
          <strong>Date:</strong> ${formatDateTime(order.createdAt)}<br>
          <strong>Customer:</strong> ${order.user?.fullName || "N/A"}<br>
          <strong>Total:</strong> ${formatCurrency(order.totalAmount || 0)}<br>
          <strong>Status:</strong> ${order.status || "pending"}
        </p>
      </div>
    </article>
  `).join("");
}

function renderRecentBookings(mount, bookings) {
  if (!mount) return;
  if (!bookings.length) {
    mount.innerHTML = `<div class="empty-state">No recent bookings.</div>`;
    return;
  }

  mount.innerHTML = bookings.map((booking) => `
    <article class="card" style="margin-bottom:1rem;">
      <div class="card-body">
        <h3 class="card-title">${booking.fullName || "Guest"}</h3>
        <p class="card-text">
          <strong>Date:</strong> ${formatDate(booking.bookingDate)}<br>
          <strong>Time:</strong> ${booking.bookingTime || "N/A"}<br>
          <strong>Guests:</strong> ${booking.guests || 0}<br>
          <strong>Status:</strong> ${booking.status || "pending"}
        </p>
      </div>
    </article>
  `).join("");
}

function renderRecentReviews(mount, reviews) {
  if (!mount) return;
  if (!reviews.length) {
    mount.innerHTML = `<div class="empty-state">No recent reviews.</div>`;
    return;
  }

  mount.innerHTML = reviews.map((review) => `
    <article class="card" style="margin-bottom:1rem;">
      <div class="card-body">
        <h3 class="card-title">${review.menuItem?.name || "Review"}</h3>
        <p class="card-text">
          <strong>User:</strong> ${review.user?.fullName || "N/A"}<br>
          <strong>Rating:</strong> ${review.rating || 0}/5<br>
          <strong>Approved:</strong> ${review.isApproved ? "Yes" : "No"}<br>
          <strong>Comment:</strong> ${review.comment || "No comment"}
        </p>
      </div>
    </article>
  `).join("");
}
