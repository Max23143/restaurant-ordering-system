document.addEventListener("DOMContentLoaded", () => {
  loadOrderHistory();
});

function formatDateTime(value) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatOrderItems(items = []) {
  if (!Array.isArray(items) || !items.length) {
    return "No items";
  }

  return items
    .map((item) => {
      const name =
        item.name ||
        item.menuItem?.name ||
        "Unnamed item";

      return `${name} x ${Number(item.quantity || 0)}`;
    })
    .join("<br>");
}

async function loadOrderHistory() {
  const mount = document.getElementById("orderHistoryContainer");
  if (!mount) return;

  if (!getToken()) {
    mount.innerHTML = `<div class="empty-state">Please log in to view your order history.</div>`;
    return;
  }

  try {
    const response = await apiRequest("/orders/my-orders");
    const orders = response.data || [];

    if (!orders.length) {
      mount.innerHTML = `<div class="empty-state">You have not placed any orders yet.</div>`;
      return;
    }

    mount.innerHTML = `
      <div class="table-responsive">
        <table class="styled-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Order Type</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Payment</th>
            </tr>
          </thead>
          <tbody>
            ${orders
              .map(
                (order) => `
                  <tr>
                    <td>${order._id || "N/A"}</td>
                    <td>${formatDateTime(order.createdAt)}</td>
                    <td>${order.orderType || "N/A"}</td>
                    <td>${formatOrderItems(order.items)}</td>
                    <td>${formatCurrency(order.totalAmount || 0)}</td>
                    <td>${order.status || "N/A"}</td>
                    <td>${order.paymentMethod || "N/A"}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    mount.innerHTML = `
      <div class="empty-state">
        Failed to load order history. ${error.message}
      </div>
    `;
  }
}