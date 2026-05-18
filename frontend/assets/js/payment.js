document.addEventListener("DOMContentLoaded", () => {
  renderPaymentSummary();
  setupPaymentForm();
  setupCardNumberFormatting();
});

function getPendingOnlineOrder() {
  const raw = localStorage.getItem("pendingOnlineOrder");

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to parse pending online order:", error);
    return null;
  }
}

function renderPaymentSummary() {
  const mount = document.getElementById("paymentOrderSummary");
  if (!mount) return;

  const pendingOrder = getPendingOnlineOrder();

  if (!pendingOrder || !pendingOrder.payload || !Array.isArray(pendingOrder.cartSnapshot)) {
    mount.innerHTML = `
      <div class="empty-state">
        No pending online order found. Please return to the cart and choose online payment again.
        <br><br>
        <a class="btn btn-primary" href="${buildFrontendUrl("cart.html")}">Back to Cart</a>
      </div>
    `;
    return;
  }

  const itemsHtml = pendingOrder.cartSnapshot.map((item) => `
    <article class="card" style="margin-bottom:1rem;">
      <div class="card-body" style="display:grid;grid-template-columns:120px 1fr;gap:1rem;">
        <img src="${item.image}" alt="${item.name}" style="width:120px;height:120px;object-fit:cover;border-radius:16px;">
        <div>
          <h3 class="card-title">${item.name}</h3>
          <p class="card-text">Quantity: ${item.quantity}</p>
          <p class="card-text">Price: ${formatCurrency(item.price)}</p>
          <strong>Line Total: ${formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}</strong>
        </div>
      </div>
    </article>
  `).join("");

  mount.innerHTML = `
    ${itemsHtml}

    <div class="form-card" style="margin-top:1rem;">
      <div class="meta-row">
        <span class="badge">Items: <strong>${pendingOrder.totalItems}</strong></span>
        <span class="badge">Total: <strong>${formatCurrency(pendingOrder.totalAmount)}</strong></span>
      </div>

      <p style="margin-top:1rem;">
        <strong>Order Type:</strong> ${pendingOrder.payload.orderType}
      </p>

      ${
        pendingOrder.payload.orderType === "delivery"
          ? `<p><strong>Delivery Address:</strong> ${pendingOrder.payload.deliveryAddress}</p>`
          : ""
      }

      <p><strong>Payment Method:</strong> Online Card Payment</p>
    </div>
  `;
}

function setupPaymentForm() {
  const form = document.getElementById("paymentForm");
  if (!form) return;

  form.addEventListener("submit", confirmOnlinePayment);
}

function setupCardNumberFormatting() {
  const cardNumberInput = document.getElementById("cardNumber");
  if (!cardNumberInput) return;

  /*
    Small UX improvement:
    While the user types card number, spaces are added every 4 digits.
  */
  cardNumberInput.addEventListener("input", () => {
    const digitsOnly = cardNumberInput.value.replace(/\D/g, "").slice(0, 16);
    cardNumberInput.value = digitsOnly.replace(/(.{4})/g, "$1 ").trim();
  });
}

function getCardPaymentDetails() {
  return {
    cardHolderName: document.getElementById("cardHolderName")?.value.trim() || "",
    cardNumber: document.getElementById("cardNumber")?.value.replace(/\s+/g, "") || "",
    expiryMonth: document.getElementById("expiryMonth")?.value.trim() || "",
    expiryYear: document.getElementById("expiryYear")?.value.trim() || "",
    cvv: document.getElementById("cvv")?.value.trim() || ""
  };
}

function validateCardDetails(details) {
  if (
    !details.cardHolderName ||
    !details.cardNumber ||
    !details.expiryMonth ||
    !details.expiryYear ||
    !details.cvv
  ) {
    return "Please complete all card details.";
  }

  if (!/^\d{16}$/.test(details.cardNumber)) {
    return "Card number must be exactly 16 digits.";
  }

  if (!/^\d{2}$/.test(details.expiryMonth)) {
    return "Expiry month must be 2 digits, for example 05.";
  }

  const month = Number(details.expiryMonth);
  if (month < 1 || month > 12) {
    return "Expiry month must be between 01 and 12.";
  }

  if (!/^\d{2,4}$/.test(details.expiryYear)) {
    return "Expiry year must be 2 or 4 digits.";
  }

  if (!/^\d{3,4}$/.test(details.cvv)) {
    return "CVV must be 3 or 4 digits.";
  }

  return "";
}

async function confirmOnlinePayment(event) {
  event.preventDefault();
  hideMessage("paymentMessage");

  const pendingOrder = getPendingOnlineOrder();

  if (!pendingOrder || !pendingOrder.payload) {
    showMessage("paymentMessage", "No pending online order found. Please return to the cart.", "error");
    return;
  }

  if (!getToken()) {
    showMessage("paymentMessage", "Please log in before confirming payment.", "error");
    return;
  }

  const cardDetails = getCardPaymentDetails();
  const cardError = validateCardDetails(cardDetails);

  if (cardError) {
    showMessage("paymentMessage", cardError, "error");
    return;
  }

  const confirmBtn = document.getElementById("confirmPaymentBtn");

  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Confirming Payment...";
  }

  try {
    const finalPayload = {
      ...pendingOrder.payload,

      /*
        Important:
        The order is created only now, after the user confirms card details.
        The backend stores only the last 4 digits of the card number.
      */
      paymentMethod: "online",
      paymentDetails: cardDetails
    };

    await apiRequest("/orders", {
      method: "POST",
      body: JSON.stringify(finalPayload)
    });

    showMessage("paymentMessage", "Payment confirmed and order placed successfully.", "success");

    saveCart([]);
    localStorage.removeItem("pendingOnlineOrder");

    setTimeout(() => {
      window.location.href = buildFrontendUrl("order-history.html");
    }, 1200);
  } catch (error) {
    showMessage("paymentMessage", error.message || "Failed to confirm payment.", "error");
  } finally {
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Confirm Payment & Place Order";
    }
  }
}