document.addEventListener("DOMContentLoaded", loadOrderHistory);

async function loadOrderHistory() {
  const mount = document.getElementById("orderHistoryTable");
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
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Order Type</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Payment Status</th>
              <th>Card</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map((order) => `
              <tr>
                <td>${order._id || "N/A"}</td>
                <td>${formatDateTime(order.createdAt)}</td>
                <td>${capitalizeText(order.orderType || "delivery")}</td>
                <td>
                  ${(order.items || []).map((item) => `
                    <div>
                      ${(item.name || item.menuItem?.name || "Item")} x ${item.quantity || 1}
                    </div>
                  `).join("")}
                </td>
                <td>${formatCurrency(order.totalAmount || 0)}</td>
                <td>${capitalizeText(order.status || "pending")}</td>
                <td>${capitalizeText(order.paymentMethod || "cash")}</td>
                <td>${capitalizeText(order.paymentDetails?.paymentStatus || "pending")}</td>
                <td>
                  ${order.paymentMethod === "card"
                    ? `${order.paymentDetails?.cardHolderName || "Card"} (${order.paymentDetails?.cardLast4 || "****"})`
                    : "-"}
                </td>
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

function capitalizeText(value = "") {
  if (!value) return "N/A";
  return value.charAt(0).toUpperCase() + value.slice(1);
}