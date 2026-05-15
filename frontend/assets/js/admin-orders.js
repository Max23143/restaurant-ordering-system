document.addEventListener("DOMContentLoaded", () => {
  loadAdminOrders();
  const refreshBtn = document.getElementById("refreshOrdersBtn");
  if (refreshBtn) refreshBtn.addEventListener("click", loadAdminOrders);
});

async function loadAdminOrders() {
  const mount = document.getElementById("adminOrdersContainer") || document.getElementById("ordersContainer");
  const statusFilter = document.getElementById("orderStatusFilter");
  const typeFilter = document.getElementById("orderTypeFilter");

  if (!mount) return;

  try {
    const response = await apiRequest("/orders/admin/all");
    let orders = response.data || [];

    const selectedStatus = statusFilter?.value || "";
    const selectedType = typeFilter?.value || "";

    if (selectedStatus) {
      orders = orders.filter((order) => String(order.status || "") === selectedStatus);
    }

    if (selectedType) {
      orders = orders.filter((order) => String(order.orderType || "") === selectedType);
    }

    if (!orders.length) {
      mount.innerHTML = `<div class="empty-state">No orders found.</div>`;
      return;
    }

    mount.innerHTML = orders.map((order) => `
      <article class="card" style="margin-bottom: 1rem;">
        <div class="card-body">
          <h3 class="card-title">Order ${order._id}</h3>
          <p class="card-text">
            <strong>Date:</strong> ${formatDateTime(order.createdAt)}<br>
            <strong>User:</strong> ${order.user?.fullName || order.fullName || "N/A"}<br>
            <strong>Order Type:</strong> ${order.orderType || "N/A"}<br>
            <strong>Total:</strong> ${formatCurrency(order.totalAmount || 0)}<br>
            <strong>Status:</strong> ${order.status || "N/A"}
          </p>
        </div>
      </article>
    `).join("");
  } catch (error) {
    mount.innerHTML = `<div class="empty-state">Failed to load orders. ${error.message}</div>`;
  }
}