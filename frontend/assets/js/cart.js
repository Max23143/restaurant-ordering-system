document.addEventListener("DOMContentLoaded", () => {
  renderCartPage();
  setupCheckoutForm();
});

function renderCartPage() {
  const cartItemsMount = document.getElementById("cartItemsContainer");
  const totalItemsElement = document.getElementById("checkoutTotalItems");
  const totalAmountElement = document.getElementById("checkoutTotalAmount");

  if (!cartItemsMount) return;

  const cart = getCart();

  if (!cart.length) {
    cartItemsMount.innerHTML = `<div class="empty-state">Your cart is empty.</div>`;
    if (totalItemsElement) totalItemsElement.textContent = "0";
    if (totalAmountElement) totalAmountElement.textContent = formatCurrency(0);
    return;
  }

  cartItemsMount.innerHTML = cart.map((item) => `
    <article class="card" style="margin-bottom:1rem;">
      <div class="card-body" style="display:grid;grid-template-columns:140px 1fr;gap:1rem;align-items:start;">
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
            <button class="btn btn-danger" onclick="removeCartItem('${item._id}')">Remove</button>
          </div>
        </div>
      </div>
    </article>
  `).join("");

  if (totalItemsElement) {
    totalItemsElement.textContent = String(
      cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    );
  }

  if (totalAmountElement) {
    totalAmountElement.textContent = formatCurrency(getCartTotal());
  }
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

  const orderType = document.getElementById("orderType")?.value || "";
  const paymentMethod = document.getElementById("paymentMethod")?.value || "";
  const deliveryAddress = document.getElementById("deliveryAddress")?.value.trim() || "";

  const payload = {
    orderType,
    paymentMethod,
    deliveryAddress,
    items: cart.map((item) => ({
      menuItem: item._id,
      quantity: Number(item.quantity || 1)
    }))
  };

  try {
    await apiRequest("/orders", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    showMessage("checkoutMessage", "Order placed successfully.", "success");
    saveCart([]);
    renderCartPage();
  } catch (error) {
    showMessage("checkoutMessage", error.message || "Failed to place order.", "error");
  }
}