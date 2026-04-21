document.addEventListener("DOMContentLoaded", () => {
  if (!protectAdminManagementPage()) return;

  document.getElementById("refreshOrdersBtn").addEventListener("click", loadAdminOrders);
  document.getElementById("orderStatusFilter").addEventListener("change", loadAdminOrders);
  document.getElementById("orderTypeFilter").addEventListener("change", loadAdminOrders);

  loadAdminOrders();
});

function protectAdminManagementPage() {
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

async function loadAdminOrders() {
  const mount = document.getElementById("adminOrdersTable");
  if (!mount) return;

  const status = document.getElementById("orderStatusFilter").value;
  const orderType = document.getElementById("orderTypeFilter").value;

  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (orderType) params.append("orderType", orderType);

  const endpoint = params.toString()
    ? `/orders/admin/all?${params.toString()}`
    : "/orders/admin/all";

  try {
    const response = await apiRequest(endpoint);
    const orders = response.data || [];

    if (!orders.length) {
      mount.innerHTML = `<div class="empty-state">No orders found.</div>`;
      return;
    }

    mount.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Type</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map((order) => `
              <tr>
                <td>${order._id || "N/A"}</td>
                <td>${order.user?.fullName || order.user?.email || "Customer"}</td>
                <td>${formatDateTime(order.createdAt)}</td>
                <td>${capitalizeAdminText(order.orderType || "delivery")}</td>
                <td>
                  ${(order.items || []).map((item) => `
                    <div>${item.name || item.menuItem?.name || "Item"} x ${item.quantity || 1}</div>
                  `).join("")}
                </td>
                <td>${formatCurrency(order.totalAmount || 0)}</td>
                <td>${capitalizeAdminText(order.status || "pending")}</td>
                <td>
                  <select onchange="updateOrderStatus('${order._id}', this.value)">
                    <option value="">Change status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    mount.innerHTML = `<div class="empty-state">Failed to load orders. ${error.message}</div>`;
  }
}

async function updateOrderStatus(orderId, status) {
  if (!status) return;

  try {
    await apiRequest(`/orders/admin/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status })
    });

    showMessage("adminOrderMessage", "Order status updated successfully.", "success");
    loadAdminOrders();
  } catch (error) {
    showMessage("adminOrderMessage", error.message || "Failed to update order status.", "error");
  }
}

function capitalizeAdminText(value = "") {
  if (!value) return "N/A";
  return value.charAt(0).toUpperCase() + value.slice(1);
}