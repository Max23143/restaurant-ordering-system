function renderCartPage() {
  const items = getCart();
  const mount = document.getElementById("cartList");
  const summary = document.getElementById("cartSummary");

  if (!items.length) {
    mount.innerHTML = `<div class="empty-state">Your cart is empty.</div>`;
    summary.innerHTML = "";
    return;
  }

  mount.innerHTML = items.map((item) => `
    <article class="card">
      <div class="card-body cart-item">
        <img src="${item.image}" alt="${item.name}" style="height: 100px; width: 120px; object-fit: cover; border-radius: 14px;">
        <div>
          <h3 class="card-title">${item.name}</h3>
          <p class="card-text">${item.description}</p>
          <p><strong>${formatCurrency(item.price)}</strong></p>
        </div>
        <div>
          <label class="small" for="qty-${item._id}">Quantity</label>
          <input id="qty-${item._id}" type="number" min="1" value="${item.quantity}" onchange="handleQuantityChange('${item._id}', this.value)">
          <div style="margin-top: 0.75rem;">
            <button class="btn btn-danger" onclick="handleRemoveItem('${item._id}')">Remove</button>
          </div>
        </div>
      </div>
    </article>
  `).join("");

  summary.innerHTML = `
    <div class="form-card">
      <h2 class="section-title">Checkout Summary</h2>
      <p>Total items: <strong>${items.reduce((sum, item) => sum + item.quantity, 0)}</strong></p>
      <p>Total amount: <strong>${formatCurrency(getCartTotal())}</strong></p>

      <form id="checkoutForm" class="form-grid">
        <div class="form-group full">
          <label for="deliveryAddress">Delivery Address</label>
          <textarea id="deliveryAddress" placeholder="Enter delivery address or dine-in note"></textarea>
        </div>
        <div class="form-group">
          <label for="paymentMethod">Payment Method</label>
          <select id="paymentMethod">
            <option value="cash">Cash</option>
            <option value="card">Card</option>
          </select>
        </div>
        <div class="form-group">
          <label for="orderNotes">Order Notes</label>
          <input id="orderNotes" type="text" placeholder="Any special instructions?">
        </div>
        <div class="form-group full">
          <button class="btn btn-primary" type="submit">Place Order</button>
        </div>
      </form>
    </div>
  `;

  document.getElementById("checkoutForm").addEventListener("submit", submitOrder);
}

function handleQuantityChange(id, value) {
  updateCartItemQuantity(id, value);
  renderCartPage();
}

function handleRemoveItem(id) {
  removeFromCart(id);
  renderCartPage();
}

async function submitOrder(event) {
  event.preventDefault();

  if (!getToken()) {
    alert("Please log in before placing an order.");
    window.location.href = "login.html";
    return;
  }

  const items = getCart();
  const payload = {
    items: items.map((item) => ({
      menuItem: item._id,
      quantity: item.quantity,
      price: item.price,
      name: item.name
    })),
    totalAmount: getCartTotal(),
    deliveryAddress: document.getElementById("deliveryAddress").value.trim(),
    paymentMethod: document.getElementById("paymentMethod").value,
    notes: document.getElementById("orderNotes").value.trim()
  };

  try {
    await apiRequest("/orders", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    saveCart([]);
    alert("Order placed successfully.");
    window.location.href = "order-history.html";
  } catch (error) {
    alert(`Failed to place order: ${error.message}`);
  }
}

document.addEventListener("DOMContentLoaded", renderCartPage);