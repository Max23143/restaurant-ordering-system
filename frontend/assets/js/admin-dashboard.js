document.addEventListener("DOMContentLoaded", initAdminDashboard);

async function initAdminDashboard() {
  if (!protectAdminPage()) return;

  try {
    const [menuResponse, orderResponse, bookingResponse, reviewResponse] = await Promise.all([
      tryGet(["/menu", "/menu/all"]),
      apiRequest("/orders/admin/all"),
      apiRequest("/bookings/admin/all"),
      apiRequest("/reviews/admin/all")
    ]);

    const menuItems = (Array.isArray(menuResponse) ? menuResponse : menuResponse.items || menuResponse.data || [])
      .map(normalizeMenuItem);

    const orders = Array.isArray(orderResponse)
      ? orderResponse
      : orderResponse.orders || orderResponse.data || [];

    const bookings = Array.isArray(bookingResponse)
      ? bookingResponse
      : bookingResponse.bookings || bookingResponse.data || [];

    const reviews = Array.isArray(reviewResponse)
      ? reviewResponse
      : reviewResponse.reviews || reviewResponse.data || [];

    renderAdminStats(menuItems, orders, bookings, reviews);
    renderRecentOrders(orders);
    renderRecentBookings(bookings);
    renderRecentReviews(reviews, menuItems);
  } catch (error) {
    document.getElementById("adminStats").innerHTML = `
      <div class="empty-state">
        Failed to load dashboard data.<br>${error.message}
      </div>
    `;
  }
}

function protectAdminPage() {
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

function renderAdminStats(menuItems, orders, bookings, reviews) {
  const totalRevenue = orders.reduce((sum, order) => {
    return sum + Number(order.totalAmount || order.total || 0);
  }, 0);

  document.getElementById("adminStats").innerHTML = `
    <article class="summary-card">
      <h3>Total Menu Items</h3>
      <p>${menuItems.length}</p>
    </article>
    <article class="summary-card">
      <h3>Total Orders</h3>
      <p>${orders.length}</p>
    </article>
    <article class="summary-card">
      <h3>Total Bookings</h3>
      <p>${bookings.length}</p>
    </article>
    <article class="summary-card">
      <h3>Total Reviews</h3>
      <p>${reviews.length}</p>
    </article>
    <article class="summary-card">
      <h3>Total Revenue</h3>
      <p>${formatCurrency(totalRevenue)}</p>
    </article>
  `;
}

function renderRecentOrders(orders) {
  const mount = document.getElementById("recentOrders");

  if (!orders.length) {
    mount.innerHTML = `<div class="empty-state">No orders found.</div>`;
    return;
  }

  const recent = [...orders]
    .sort((a, b) => new Date(b.createdAt || b.orderDate || 0) - new Date(a.createdAt || a.orderDate || 0))
    .slice(0, 8);

  mount.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${recent.map((order) => `
            <tr>
              <td>${order._id || order.id || "N/A"}</td>
              <td>${order.user?.fullName || order.customerName || order.user?.email || "Customer"}</td>
              <td>${formatDateTime(order.createdAt || order.orderDate)}</td>
              <td>${formatCurrency(order.totalAmount || order.total || 0)}</td>
              <td>${order.status || order.orderStatus || "Pending"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderRecentBookings(bookings) {
  const mount = document.getElementById("recentBookings");

  if (!bookings.length) {
    mount.innerHTML = `<div class="empty-state">No bookings found.</div>`;
    return;
  }

  const recent = [...bookings]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 8);

  mount.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Date</th>
            <th>Time</th>
            <th>Guests</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${recent.map((booking) => `
            <tr>
              <td>${booking.fullName || booking.customerName || booking.name || "N/A"}</td>
              <td>${booking.email || booking.user?.email || "N/A"}</td>
              <td>${formatDate(booking.bookingDate || booking.date)}</td>
              <td>${booking.bookingTime || booking.time || "N/A"}</td>
              <td>${booking.numberOfGuests || booking.guestCount || booking.guests || "N/A"}</td>
              <td>${booking.status || "Pending"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderRecentReviews(reviews, menuItems) {
  const mount = document.getElementById("recentReviews");

  if (!reviews.length) {
    mount.innerHTML = `<div class="empty-state">No reviews found.</div>`;
    return;
  }

  const recent = [...reviews]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || a.createdAt || 0))
    .slice(0, 6);

  mount.innerHTML = recent.map((review) => {
    const itemId = review.menuItem?._id || review.menuItem || review.itemId || "";
    const itemName =
      review.menuItem?.name ||
      review.itemName ||
      menuItems.find((item) => item._id === itemId)?.name ||
      "Menu Item";

    return `
      <article class="card review-card">
        <div class="meta-row">
          <strong>${review.user?.fullName || review.fullName || review.name || "Customer"}</strong>
          <span class="badge">${itemName}</span>
        </div>
        <div class="rating-row">
          <span class="stars">${renderStars(review.rating || 0)}</span>
          <span class="small">${formatDate(review.createdAt)}</span>
        </div>
        <p class="card-text">${review.comment || review.reviewText || "No comment provided."}</p>
      </article>
    `;
  }).join("");
}