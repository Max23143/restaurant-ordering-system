document.addEventListener("DOMContentLoaded", () => {
  renderCartPage();
  setupCheckoutForm();
  setupOrderTypeToggle();
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
            <input type="number" min="1" value="${item.quantity}" onchange="changeCartQuantity('${item._id}', this.value)" style="max-width:140px;">
            <button class="btn btn-danger" onclick="removeCartItem('${item._id}')">Remove</button>
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
    if (deliveryAddress) deliveryAddress.required = isDelivery;
  };

  orderType.addEventListener("change", toggleDeliveryAddress);
  toggleDeliveryAddress();
}

async function submitOrder(event) {
  event.preventDefault();
  hideMessage("checkoutMessage");

  if (!getToken()) {
    showMessage("checkoutMessage", "Please log in before placing an order.", "error");
    return;
  }

  const cart = getCart();
  if (!cart.length) {
    showMessage("checkoutMessage", "Your cart is empty.", "error");
    return;
  }

  const submitBtn = document.getElementById("checkoutBtn");
  const orderType = document.getElementById("orderType")?.value || "delivery";
  const deliveryAddress = document.getElementById("deliveryAddress")?.value.trim() || "";

  if (orderType === "delivery" && !deliveryAddress) {
    showMessage("checkoutMessage", "Delivery address is required for delivery orders.", "error");
    return;
  }

  const payload = {
    orderType,
    paymentMethod: document.getElementById("paymentMethod")?.value || "cash",
    deliveryAddress,
    specialInstructions: document.getElementById("specialInstructions")?.value.trim() || "",
    items: cart.map((item) => ({
      menuItem: item._id,
      quantity: Number(item.quantity || 1)
    }))
  };

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Placing Order...";
  }

  try {
    await apiRequest("/orders", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    showMessage("checkoutMessage", "Order placed successfully.", "success");
    saveCart([]);
    renderCartPage();
    event.target.reset();
    setupOrderTypeToggle();
  } catch (error) {
    showMessage("checkoutMessage", error.message || "Failed to place order.", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Place Order";
    }
  }
}
