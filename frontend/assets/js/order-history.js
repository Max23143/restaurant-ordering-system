async function loadOrderHistory() {
  const mount = document.getElementById("orderHistoryTable");

  if (!getToken()) {
    mount.innerHTML = `<div class="empty-state">Please log in to view your order history.</div>`;
    return;
  }

  try {
    const response = await tryGet([
      "/orders/my-orders",
      "/orders/user-orders",
      "/orders/mine",
      "/orders"
    ]);

    const orders = Array.isArray(response) ? response : response.orders || response.data || [];

    if (!orders.length) {
      mount.innerHTML = `<div class="empty-state">You have not placed any orders yet.</div>`;
      return;
    }

    mount.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Payment</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map((order) => `
              <tr>
                <td>${order._id || order.id || "N/A"}</td>
                <td>${formatDateTime(order.createdAt || order.orderDate)}</td>
                <td>
                  ${(order.items || []).map((item) => `
                    <div>${item.name || item.menuItem?.name || "Item"} x ${item.quantity || 1}</div>
                  `).join("") || "No items"}
                </td>
                <td>${formatCurrency(order.totalAmount || order.total || 0)}</td>
                <td>${order.status || order.orderStatus || "Pending"}</td>
                <td>${order.paymentMethod || "N/A"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    mount.innerHTML = `<div class="empty-state">Failed to load order history. ${error.message}</div>`;
  }
}

document.addEventListener("DOMContentLoaded", loadOrderHistory);