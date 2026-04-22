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
            <option value="dine-in">Dine-in</option>
          </select>
        </div>

        <div class="form-group">
          <label for="paymentMethod">Payment Method</label>
          <select id="paymentMethod" required>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="online">Online</option>
          </select>
        </div>

        <div class="form-group full">
          <label for="deliveryAddress">Delivery Address</label>
          <textarea id="deliveryAddress" placeholder="Required for delivery orders"></textarea>
        </div>

        <div id="cardPaymentSection" class="form-group full hide">
          <div class="form-card" style="padding: 1rem; background: #fffaf5;">
            <h3 class="section-title" style="font-size: 1.2rem; margin-bottom: 1rem;">Card Details</h3>

            <div class="form-grid">
              <div class="form-group full">
                <label for="cardHolderName">Card Holder Name</label>
                <input id="cardHolderName" type="text" placeholder="Name on card">
              </div>

              <div class="form-group full">
                <label for="cardNumber">Card Number</label>
                <input id="cardNumber" type="text" maxlength="19" placeholder="1234 5678 9012 3456">
              </div>

              <div class="form-group">
                <label for="expiryMonth">Expiry Month</label>
                <input id="expiryMonth" type="text" maxlength="2" placeholder="MM">
              </div>

              <div class="form-group">
                <label for="expiryYear">Expiry Year</label>
                <input id="expiryYear" type="text" maxlength="4" placeholder="YY or YYYY">
              </div>

              <div class="form-group">
                <label for="cvv">CVV</label>
                <input id="cvv" type="password" maxlength="4" placeholder="123">
              </div>
            </div>
          </div>
        </div>

        <div class="form-group full">
          <label for="specialInstructions">Special Instructions</label>
          <textarea id="specialInstructions" placeholder="Optional instructions"></textarea>
        </div>

        <div class="form-group full">
          <button class="btn btn-primary" id="placeOrderBtn" type="submit">Confirm Order</button>
        </div>
      </form>
    </div>
  `;

  const orderTypeSelect = document.getElementById("orderType");
  const paymentMethodSelect = document.getElementById("paymentMethod");

  toggleDeliveryAddress(orderTypeSelect.value);
  toggleCardSection(paymentMethodSelect.value);

  orderTypeSelect.addEventListener("change", () => {
    toggleDeliveryAddress(orderTypeSelect.value);
  });

  paymentMethodSelect.addEventListener("change", () => {
    toggleCardSection(paymentMethodSelect.value);
  });

  const cardNumberInput = document.getElementById("cardNumber");
  if (cardNumberInput) {
    cardNumberInput.addEventListener("input", formatCardNumberInput);
  }

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
    deliveryAddressInput.placeholder = "Not required for this order type";
  }
}

function toggleCardSection(paymentMethod) {
  const cardSection = document.getElementById("cardPaymentSection");
  if (!cardSection) return;

  if (paymentMethod === "card") {
    cardSection.classList.remove("hide");
  } else {
    cardSection.classList.add("hide");
    clearCardFields();
  }
}

function clearCardFields() {
  const ids = ["cardHolderName", "cardNumber", "expiryMonth", "expiryYear", "cvv"];
  ids.forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.value = "";
  });
}

function formatCardNumberInput(event) {
  const digitsOnly = event.target.value.replace(/\D/g, "").slice(0, 16);
  event.target.value = digitsOnly.replace(/(.{4})/g, "$1 ").trim();
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

  let paymentDetails = {};

  if (paymentMethod === "card") {
    const cardHolderName = document.getElementById("cardHolderName").value.trim();
    const cardNumber = document.getElementById("cardNumber").value.replace(/\s+/g, "");
    const expiryMonth = document.getElementById("expiryMonth").value.trim();
    const expiryYear = document.getElementById("expiryYear").value.trim();
    const cvv = document.getElementById("cvv").value.trim();

    if (!cardHolderName || !cardNumber || !expiryMonth || !expiryYear || !cvv) {
      showMessage("cartMessage", "Please complete all card details.", "error");
      return;
    }

    paymentDetails = {
      cardHolderName,
      cardNumber,
      expiryMonth,
      expiryYear,
      cvv
    };
  }

  const payload = {
    items: cartItems.map((item) => ({
      menuItem: item._id,
      quantity: Number(item.quantity || 1)
    })),
    orderType,
    paymentMethod,
    deliveryAddress,
    specialInstructions,
    paymentDetails
  };

  placeOrderBtn.disabled = true;
  placeOrderBtn.textContent = "Confirming Order...";

  try {
    if (paymentMethod === "card") {
      const otpResponse = await apiRequest("/orders/card/request-otp", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      alert(`Demo OTP for card payment: ${otpResponse.demoOtp}`);

      const enteredOtp = prompt("Enter the OTP to confirm your card payment:");
      if (!enteredOtp) {
        throw new Error("OTP entry cancelled.");
      }

      await apiRequest("/orders/card/confirm-otp", {
        method: "POST",
        body: JSON.stringify({ otp: enteredOtp })
      });
    } else {
      await apiRequest("/orders", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }

    saveCart([]);
    showMessage("cartMessage", "Order placed successfully.", "success");

    setTimeout(() => {
      window.location.href = buildFrontendUrl("order-history.html");
    }, 700);
  } catch (error) {
    showMessage("cartMessage", error.message || "Failed to place order.", "error");
  } finally {
    placeOrderBtn.disabled = false;
    placeOrderBtn.textContent = "Confirm Order";
  }
}