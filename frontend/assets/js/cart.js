document.addEventListener("DOMContentLoaded", renderCartPage);

function renderCartPage() {
  const items = getCart();
  const listMount = document.getElementById("cartList");
  const summaryMount = document.getElementById("cartSummary");

  if (!listMount || !summaryMount) return;

  if (!items.length) {
    listMount.innerHTML = `<div class="empty-state">Your cart is empty.</div>`;
    summaryMount.innerHTML = "";
    return;
  }

  listMount.innerHTML = items.map((item) => `
    <article class="card">
      <div class="card-body cart-item">
        <img
          src="${item.image}"
          alt="${item.name}"
          style="height: 100px; width: 120px; object-fit: cover; border-radius: 14px;"
        >

        <div>
          <h3 class="card-title">${item.name}</h3>
          <p class="card-text">${item.description}</p>
          <p><strong>${formatCurrency(item.price)}</strong></p>
        </div>

        <div>
          <label class="small" for="qty-${item._id}">Quantity</label>
          <input
            id="qty-${item._id}"
            type="number"
            min="1"
            value="${item.quantity}"
            onchange="handleQuantityChange('${item._id}', this.value)"
          >
          <div style="margin-top: 0.75rem;">
            <button class="btn btn-danger" onclick="handleRemoveItem('${item._id}')">Remove</button>
          </div>
        </div>
      </div>
    </article>
  `).join("");

  summaryMount.innerHTML = `
    <div class="form-card">
      <h2 class="section-title">Checkout Summary</h2>
      <p>Total items: <strong>${items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)}</strong></p>
      <p>Total amount: <strong>${formatCurrency(getCartTotal())}</strong></p>

      <div id="cartMessage" class="message hide"></div>

      <form id="checkoutForm" class="form-grid">
        <div class="form-group">
          <label for="orderType">Order Type</label>
          <select id="orderType" required>
            <option value="delivery">Delivery</option>
            <option value="pickup">Pickup</option>
          </select>
        </div>

        <div class="form-group">
          <label for="paymentMethod">Payment Method</label>
          <select id="paymentMethod" required>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
          </select>
        </div>

        <div class="form-group full">
          <label for="deliveryAddress">Delivery Address</label>
          <textarea id="deliveryAddress" placeholder="Required for delivery orders"></textarea>
        </div>

        <div class="form-group full">
          <label for="specialInstructions">Special Instructions</label>
          <textarea id="specialInstructions" placeholder="Optional instructions"></textarea>
        </div>

        <div class="form-group full">
          <button class="btn btn-primary" id="placeOrderBtn" type="submit">Place Order</button>
        </div>
      </form>
    </div>
  `;

  const orderTypeSelect = document.getElementById("orderType");
  const deliveryAddressInput = document.getElementById("deliveryAddress");

  toggleDeliveryAddress(orderTypeSelect.value);

  orderTypeSelect.addEventListener("change", () => {
    toggleDeliveryAddress(orderTypeSelect.value);
  });

  document.getElementById("checkoutForm").addEventListener("submit", submitOrder);
}

function toggleDeliveryAddress(orderType) {
  const deliveryAddressInput = document.getElementById("deliveryAddress");
  if (!deliveryAddressInput) return;

  if (orderType === "delivery") {
    deliveryAddressInput.disabled = false;
    deliveryAddressInput.placeholder = "Enter delivery address";
  } else {
    deliveryAddressInput.disabled = true;
    deliveryAddressInput.value = "";
    deliveryAddressInput.placeholder = "Not required for pickup";
  }
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
    window.location.href = buildFrontendUrl("login.html");
    return;
  }

  const cartItems = getCart();
  const orderType = document.getElementById("orderType").value;
  const paymentMethod = document.getElementById("paymentMethod").value;
  const deliveryAddress = document.getElementById("deliveryAddress").value.trim();
  const specialInstructions = document.getElementById("specialInstructions").value.trim();
  const placeOrderBtn = document.getElementById("placeOrderBtn");

  if (!cartItems.length) {
    showMessage("cartMessage", "Your cart is empty.", "error");
    return;
  }

  if (orderType === "delivery" && !deliveryAddress) {
    showMessage("cartMessage", "Delivery address is required for delivery orders.", "error");
    return;
  }

  const payload = {
    items: cartItems.map((item) => ({
      menuItem: item._id,
      quantity: Number(item.quantity || 1)
    })),
    orderType,
    paymentMethod,
    deliveryAddress,
    specialInstructions
  };

  placeOrderBtn.disabled = true;
  placeOrderBtn.textContent = "Placing Order...";

  try {
    await apiRequest("/orders", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    saveCart([]);
    showMessage("cartMessage", "Order placed successfully.", "success");

    setTimeout(() => {
      window.location.href = buildFrontendUrl("order-history.html");
    }, 700);
  } catch (error) {
    showMessage("cartMessage", error.message, "error");
  } finally {
    placeOrderBtn.disabled = false;
    placeOrderBtn.textContent = "Place Order";
  }
}