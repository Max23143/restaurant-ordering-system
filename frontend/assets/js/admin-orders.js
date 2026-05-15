document.addEventListener("DOMContentLoaded", () => {
  loadAdminOrders();

  const refreshBtn = document.getElementById("refreshOrdersBtn");
  if (refreshBtn) refreshBtn.addEventListener("click", loadAdminOrders);
});

async function loadAdminOrders() {
  const mount = document.getElementById("adminOrdersTable");
  const statusFilter = document.getElementById("orderStatusFilter");
  const typeFilter = document.getElementById("orderTypeFilter");

  if (!mount) return;

  try {
    const response = await apiRequest("/orders/admin/all");
    let orders = response.data || [];

    if (statusFilter?.value) {
      orders = orders.filter((order) => String(order.status || "").toLowerCase() === statusFilter.value.toLowerCase());
    }

    if (typeFilter?.value) {
      orders = orders.filter((order) => String(order.orderType || "").toLowerCase() === typeFilter.value.toLowerCase());
    }

    if (!orders.length) {
      mount.innerHTML = `<div class="empty-state">No orders found.</div>`;
      return;
    }

    mount.innerHTML = orders.map((order) => `
      <article class="card" style="margin-bottom:1rem;">
        <div class="card-body">
          <h3 class="card-title">Order ${order._id}</h3>
          <p class="card-text">
            <strong>Date:</strong> ${formatDateTime(order.createdAt)}<br>
            <strong>User:</strong> ${order.user?.fullName || order.fullName || "N/A"}<br>
            <strong>Order Type:</strong> ${order.orderType || "N/A"}<br>
            <strong>Total:</strong> ${formatCurrency(order.totalAmount || 0)}<br>
            <strong>Status:</strong> ${order.status || "N/A"}
          </p>
          <div class="inline-actions">
            <select onchange="updateAdminOrderStatus('${order._id}', this.value)">
              <option value="">Change Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </article>
    `).join("");
  } catch (error) {
    mount.innerHTML = `<div class="empty-state">Failed to load orders. ${error.message}</div>`;
  }
}

async function updateAdminOrderStatus(id, status) {
  if (!status) return;

  try {
    await apiRequest(`/orders/admin/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status })
    });
    loadAdminOrders();
  } catch (error) {
    alert(error.message || "Failed to update order status.");
  }
}
