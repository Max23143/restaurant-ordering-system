document.addEventListener("DOMContentLoaded", renderCartPage);

let pendingCardOrderPayload = null;

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

      <form id="checkoutForm" class="form-grid" novalidate>
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

      <div id="paymentOtpSection" class="form-card hide" style="margin-top: 1rem; background: #fffaf5;">
        <h3 class="section-title" style="font-size: 1.2rem; margin-bottom: 0.5rem;">Confirm Card Payment OTP</h3>
        <p class="page-subtitle" style="margin-bottom: 1rem;">
          Enter the OTP sent to your registered phone number to confirm this payment.
        </p>

        <form id="paymentOtpForm" class="form-grid" novalidate>
          <div class="form-group full">
            <label for="paymentOtp">OTP Code</label>
            <input id="paymentOtp" type="text" maxlength="6" placeholder="Enter 6-digit OTP" required>
          </div>

          <div class="form-group full">
            <div class="inline-actions">
              <button class="btn btn-primary" id="confirmPaymentOtpBtn" type="submit">Confirm Payment OTP</button>
              <button class="btn btn-secondary" id="resendPaymentOtpBtn" type="button">Resend OTP</button>
              <button class="btn btn-secondary" id="cancelPaymentOtpBtn" type="button">Cancel</button>
            </div>
          </div>
        </form>
      </div>
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
    hidePaymentOtpSection();
  });

  const cardNumberInput = document.getElementById("cardNumber");
  if (cardNumberInput) {
    cardNumberInput.addEventListener("input", formatCardNumberInput);
  }

  document.getElementById("checkoutForm").addEventListener("submit", submitOrder);

  const paymentOtpForm = document.getElementById("paymentOtpForm");
  if (paymentOtpForm) {
    paymentOtpForm.addEventListener("submit", confirmPaymentOtp);
  }

  const resendPaymentOtpBtn = document.getElementById("resendPaymentOtpBtn");
  if (resendPaymentOtpBtn) {
    resendPaymentOtpBtn.addEventListener("click", resendPaymentOtp);
  }

  const cancelPaymentOtpBtn = document.getElementById("cancelPaymentOtpBtn");
  if (cancelPaymentOtpBtn) {
    cancelPaymentOtpBtn.addEventListener("click", cancelPaymentOtpFlow);
  }
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

function showPaymentOtpSection() {
  const section = document.getElementById("paymentOtpSection");
  if (!section) return;

  section.classList.remove("hide");
  const otpInput = document.getElementById("paymentOtp");
  if (otpInput) otpInput.focus();
}

function hidePaymentOtpSection() {
  const section = document.getElementById("paymentOtpSection");
  if (!section) return;

  section.classList.add("hide");
  const otpInput = document.getElementById("paymentOtp");
  if (otpInput) otpInput.value = "";
}

function cancelPaymentOtpFlow() {
  pendingCardOrderPayload = null;
  hidePaymentOtpSection();
  showMessage("cartMessage", "Card payment OTP flow cancelled.", "info");
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

function buildOrderPayload() {
  const cartItems = getCart();
  const orderType = document.getElementById("orderType").value;
  const paymentMethod = document.getElementById("paymentMethod").value;
  const deliveryAddress = document.getElementById("deliveryAddress").value.trim();
  const specialInstructions = document.getElementById("specialInstructions").value.trim();

  if (!cartItems.length) {
    throw new Error("Your cart is empty.");
  }

  if (orderType === "delivery" && !deliveryAddress) {
    throw new Error("Delivery address is required for delivery orders.");
  }

  let paymentDetails = {};

  if (paymentMethod === "card") {
    const cardHolderName = document.getElementById("cardHolderName").value.trim();
    const cardNumber = document.getElementById("cardNumber").value.replace(/\s+/g, "");
    const expiryMonth = document.getElementById("expiryMonth").value.trim();
    const expiryYear = document.getElementById("expiryYear").value.trim();
    const cvv = document.getElementById("cvv").value.trim();

    if (!cardHolderName || !cardNumber || !expiryMonth || !expiryYear || !cvv) {
      throw new Error("Please complete all card details.");
    }

    if (!/^\d{16}$/.test(cardNumber)) {
      throw new Error("Card number must be 16 digits.");
    }

    if (!/^\d{2}$/.test(expiryMonth) || Number(expiryMonth) < 1 || Number(expiryMonth) > 12) {
      throw new Error("Expiry month must be between 01 and 12.");
    }

    if (!/^\d{2,4}$/.test(expiryYear)) {
      throw new Error("Expiry year is invalid.");
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      throw new Error("CVV must be 3 or 4 digits.");
    }

    paymentDetails = {
      cardHolderName,
      cardNumber,
      expiryMonth,
      expiryYear,
      cvv
    };
  }

  return {
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
}

async function submitOrder(event) {
  event.preventDefault();
  hideMessage("cartMessage");

  if (!getToken()) {
    showMessage("cartMessage", "Please log in before placing an order.", "error");
    setTimeout(() => {
      window.location.href = buildFrontendUrl("login.html");
    }, 700);
    return;
  }

  const placeOrderBtn = document.getElementById("placeOrderBtn");
  placeOrderBtn.disabled = true;
  placeOrderBtn.textContent = "Processing...";

  try {
    const payload = buildOrderPayload();

    if (payload.paymentMethod === "card") {
      pendingCardOrderPayload = payload;

      await apiRequest("/orders/card/request-otp", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      showPaymentOtpSection();
      showMessage("cartMessage", "Payment OTP sent successfully. Enter the OTP below to confirm your card payment.", "success");
    } else {
      await apiRequest("/orders", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      saveCart([]);
      showMessage("cartMessage", "Order placed successfully.", "success");

      setTimeout(() => {
        window.location.href = buildFrontendUrl("order-history.html");
      }, 700);
    }
  } catch (error) {
    showMessage("cartMessage", error.message || "Failed to place order.", "error");
  } finally {
    placeOrderBtn.disabled = false;
    placeOrderBtn.textContent = "Confirm Order";
  }
}

async function confirmPaymentOtp(event) {
  event.preventDefault();
  hideMessage("cartMessage");

  const otp = document.getElementById("paymentOtp")?.value.trim() || "";
  const confirmBtn = document.getElementById("confirmPaymentOtpBtn");

  if (!pendingCardOrderPayload) {
    showMessage("cartMessage", "No pending card payment found. Please request OTP again.", "error");
    return;
  }

  if (!otp) {
    showMessage("cartMessage", "Please enter the OTP code.", "error");
    return;
  }

  confirmBtn.disabled = true;
  confirmBtn.textContent = "Confirming...";

  try {
    await apiRequest("/orders/card/confirm-otp", {
      method: "POST",
      body: JSON.stringify({ otp })
    });

    pendingCardOrderPayload = null;
    saveCart([]);
    hidePaymentOtpSection();
    clearCardFields();

    showMessage("cartMessage", "Card payment confirmed and order placed successfully.", "success");

    setTimeout(() => {
      window.location.href = buildFrontendUrl("order-history.html");
    }, 700);
  } catch (error) {
    showMessage("cartMessage", error.message || "Payment OTP verification failed.", "error");
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Confirm Payment OTP";
  }
}

async function resendPaymentOtp() {
  hideMessage("cartMessage");

  const resendBtn = document.getElementById("resendPaymentOtpBtn");

  if (!pendingCardOrderPayload) {
    showMessage("cartMessage", "No pending card payment found. Please start again.", "error");
    return;
  }

  resendBtn.disabled = true;
  resendBtn.textContent = "Resending...";

  try {
    await apiRequest("/orders/card/request-otp", {
      method: "POST",
      body: JSON.stringify(pendingCardOrderPayload)
    });

    showMessage("cartMessage", "Payment OTP resent successfully.", "success");
  } catch (error) {
    showMessage("cartMessage", error.message || "Failed to resend payment OTP.", "error");
  } finally {
    resendBtn.disabled = false;
    resendBtn.textContent = "Resend OTP";
  }
}