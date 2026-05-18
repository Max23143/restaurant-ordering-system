document.addEventListener("DOMContentLoaded", () => {
  renderCartPage();
  setupCheckoutForm();
  setupOrderTypeToggle();
  setupPaymentMethodHint();
});

function renderCartPage() {
  const cartItemsMount = document.getElementById("cartItemsContainer") || document.getElementById("cartList");
  const totalItemsElement = document.getElementById("checkoutTotalItems");
  const totalAmountElement = document.getElementById("checkoutTotalAmount") || document.getElementById("cartSummary");

  if (!cartItemsMount) return;

  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalAmount = getCartTotal();

  if (!cart.length) {
    cartItemsMount.innerHTML = `<div class="empty-state">Your cart is empty.</div>`;
    if (totalItemsElement) totalItemsElement.textContent = "0";
    if (totalAmountElement) totalAmountElement.textContent = formatCurrency(0);
    return;
  }

  cartItemsMount.innerHTML = cart.map((item) => `
    <article class="card" style="margin-bottom:1rem;">
      <div class="card-body" style="display:grid;grid-template-columns:140px 1fr;gap:1rem;">
        <img src="${item.image}" alt="${item.name}" style="width:140px;height:140px;object-fit:cover;border-radius:16px;">
        <div>
          <h3 class="card-title">${item.name}</h3>
          <p class="card-text">${item.description || ""}</p>
          <strong>${formatCurrency(item.price)}</strong>

          <div style="margin-top:1rem;display:flex;gap:1rem;align-items:center;flex-wrap:wrap;">
            <input
              type="number"
              min="1"
              value="${item.quantity}"
              onchange="changeCartQuantity('${item._id}', this.value)"
              style="max-width:140px;"
            >
            <button class="btn btn-danger" onclick="removeCartItem('${item._id}')">
              Remove
            </button>
          </div>
        </div>
      </div>
    </article>
  `).join("");

  if (totalItemsElement) totalItemsElement.textContent = String(totalItems);
  if (totalAmountElement) totalAmountElement.textContent = formatCurrency(totalAmount);
}

function changeCartQuantity(id, quantity) {
  updateCartItemQuantity(id, quantity);
  renderCartPage();
}

function removeCartItem(id) {
  removeFromCart(id);
  renderCartPage();
}

function setupCheckoutForm() {
  const form = document.getElementById("checkoutForm");
  if (!form) return;

  form.addEventListener("submit", submitOrder);
}

function setupOrderTypeToggle() {
  const orderType = document.getElementById("orderType");
  const deliveryAddressGroup = document.getElementById("deliveryAddressGroup");
  const deliveryAddress = document.getElementById("deliveryAddress");

  if (!orderType || !deliveryAddressGroup) return;

  const toggleDeliveryAddress = () => {
    const isDelivery = orderType.value === "delivery";

    deliveryAddressGroup.classList.toggle("hide", !isDelivery);

    if (deliveryAddress) {
      deliveryAddress.required = isDelivery;
    }
  };

  orderType.addEventListener("change", toggleDeliveryAddress);
  toggleDeliveryAddress();
}

function setupPaymentMethodHint() {
  const paymentMethod = document.getElementById("paymentMethod");
  const hint = document.getElementById("paymentMethodHint");

  if (!paymentMethod || !hint) return;

  const updateHint = () => {
    if (paymentMethod.value === "online") {
      hint.textContent = "Online payment will take you to a card details page before the order is confirmed.";
    } else {
      hint.textContent = "Cash orders are confirmed directly from this checkout page.";
    }
  };

  paymentMethod.addEventListener("change", updateHint);
  updateHint();
}

function buildOrderPayloadFromCheckout() {
  const cart = getCart();

  return {
    orderType: document.getElementById("orderType")?.value || "delivery",
    paymentMethod: document.getElementById("paymentMethod")?.value || "cash",
    deliveryAddress: document.getElementById("deliveryAddress")?.value.trim() || "",
    specialInstructions: document.getElementById("specialInstructions")?.value.trim() || "",

    /*
      Important:
      Only item ID and quantity are sent to the backend.
      The backend calculates price from MongoDB, so users cannot fake prices from the browser.
    */
    items: cart.map((item) => ({
      menuItem: item._id,
      quantity: Number(item.quantity || 1)
    }))
  };
}

function validateCheckoutBeforeSubmit(payload) {
  const cart = getCart();

  if (!getToken()) {
    return "Please log in before placing an order.";
  }

  if (!cart.length) {
    return "Your cart is empty.";
  }

  if (payload.orderType === "delivery" && !payload.deliveryAddress) {
    return "Delivery address is required for delivery orders.";
  }

  return "";
}

async function submitOrder(event) {
  event.preventDefault();
  hideMessage("checkoutMessage");

  const submitBtn = document.getElementById("checkoutBtn");
  const payload = buildOrderPayloadFromCheckout();
  const validationError = validateCheckoutBeforeSubmit(payload);

  if (validationError) {
    showMessage("checkoutMessage", validationError, "error");
    return;
  }

  /*
    Online payment flow:
    If the user selects online payment, the order is NOT created yet.
    The order details are temporarily stored and the user is redirected to payment.html.
    The order will only be created after the user enters card details and confirms payment.
  */
  if (payload.paymentMethod === "online") {
    const pendingOrder = {
      payload,
      cartSnapshot: getCart(),
      totalItems: getCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      totalAmount: getCartTotal(),
      createdAt: new Date().toISOString()
    };

    localStorage.setItem("pendingOnlineOrder", JSON.stringify(pendingOrder));
    window.location.href = buildFrontendUrl("payment.html");
    return;
  }

  /*
    Cash payment flow:
    Cash does not need a separate payment page.
    The order is created immediately from the cart checkout page.
  */
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Placing Order...";
  }

  try {
    await apiRequest("/orders", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    showMessage("checkoutMessage", "Order placed successfully. Payment will be collected in cash.", "success");

    saveCart([]);
    localStorage.removeItem("pendingOnlineOrder");
    renderCartPage();
    event.target.reset();
    setupOrderTypeToggle();
    setupPaymentMethodHint();
  } catch (error) {
    showMessage("checkoutMessage", error.message || "Failed to place order.", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Place Order";
    }
  }
}