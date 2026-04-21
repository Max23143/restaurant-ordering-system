let adminMenuItems = [];

document.addEventListener("DOMContentLoaded", () => {
  if (!protectAdminMenuPage()) return;

  loadAdminMenuItems();
  document.getElementById("menuForm").addEventListener("submit", submitMenuForm);
  document.getElementById("resetMenuFormBtn").addEventListener("click", resetMenuForm);
});

function protectAdminMenuPage() {
  const currentUser = getCurrentUser();

  if (!currentUser || !getToken()) {
    window.location.href = buildFrontendUrl("login.html");
    return false;
  }

  if (getUserRole() !== "admin") {
    window.location.href = buildFrontendUrl("index.html");
    return false;
  }

  return true;
}

async function loadAdminMenuItems() {
  try {
    const response = await tryGet(["/menu", "/menu/all"]);
    const rawItems = Array.isArray(response) ? response : response.items || response.data || [];
    adminMenuItems = rawItems.map(normalizeMenuItem);
    renderAdminMenuList(adminMenuItems);
  } catch (error) {
    document.getElementById("adminMenuList").innerHTML =
      `<div class="empty-state">Failed to load menu items. ${error.message}</div>`;
  }
}

function renderAdminMenuList(items) {
  const mount = document.getElementById("adminMenuList");

  if (!items.length) {
    mount.innerHTML = `<div class="empty-state">No menu items available.</div>`;
    return;
  }

  mount.innerHTML = items.map((item) => `
    <article class="card">
      <div class="card-body">
        <div class="meta-row">
          <span class="badge">${item.category}</span>
          <span class="badge ${item.isAvailable ? "badge-success" : "badge-muted"}">
            ${item.isAvailable ? "Available" : "Unavailable"}
          </span>
        </div>

        <h3 class="card-title">${item.name}</h3>
        <p class="card-text">${item.description}</p>

        <div class="price-row">
          <strong>${formatCurrency(item.price)}</strong>
          <span class="small">Rating: ${item.rating.toFixed(1)}</span>
        </div>

        <div class="item-actions" style="margin-top: 1rem;">
          <button class="btn btn-secondary" onclick="editMenuItem('${item._id}')">Edit</button>
          <button class="btn btn-secondary" onclick="toggleAvailability('${item._id}')">
            ${item.isAvailable ? "Mark Unavailable" : "Mark Available"}
          </button>
          <button class="btn btn-danger" onclick="deleteMenuItem('${item._id}')">Delete</button>
        </div>
      </div>
    </article>
  `).join("");
}

function editMenuItem(id) {
  const item = adminMenuItems.find((menuItem) => menuItem._id === id);
  if (!item) return;

  document.getElementById("menuItemId").value = item._id;
  document.getElementById("menuName").value = item.name;
  document.getElementById("menuCategory").value = item.category;
  document.getElementById("menuPrice").value = item.price;
  document.getElementById("menuImage").value = item.image;
  document.getElementById("menuDescription").value = item.description;
  document.getElementById("menuTags").value = (item.tags || []).join(", ");
  document.getElementById("menuAvailable").checked = item.isAvailable;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetMenuForm() {
  document.getElementById("menuForm").reset();
  document.getElementById("menuItemId").value = "";
  document.getElementById("menuAvailable").checked = true;
  hideMessage("adminMenuMessage");
}

async function submitMenuForm(event) {
  event.preventDefault();
  hideMessage("adminMenuMessage");

  const id = document.getElementById("menuItemId").value.trim();
  const payload = {
    name: document.getElementById("menuName").value.trim(),
    category: document.getElementById("menuCategory").value,
    price: Number(document.getElementById("menuPrice").value),
    image: document.getElementById("menuImage").value.trim(),
    description: document.getElementById("menuDescription").value.trim(),
    tags: document.getElementById("menuTags").value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    isAvailable: document.getElementById("menuAvailable").checked
  };

  try {
    if (id) {
      await apiRequest(`/menu/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      showMessage("adminMenuMessage", "Menu item updated successfully.", "success");
    } else {
      await apiRequest("/menu", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      showMessage("adminMenuMessage", "Menu item added successfully.", "success");
    }

    resetMenuForm();
    loadAdminMenuItems();
  } catch (error) {
    showMessage("adminMenuMessage", error.message, "error");
  }
}

async function toggleAvailability(id) {
  const item = adminMenuItems.find((menuItem) => menuItem._id === id);
  if (!item) return;

  try {
    await apiRequest(`/menu/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        isAvailable: !item.isAvailable
      })
    });

    showMessage("adminMenuMessage", "Availability updated successfully.", "success");
    loadAdminMenuItems();
  } catch (error) {
    showMessage("adminMenuMessage", error.message, "error");
  }
}

async function deleteMenuItem(id) {
  const confirmed = confirm("Are you sure you want to delete this menu item?");
  if (!confirmed) return;

  try {
    await apiRequest(`/menu/${id}`, {
      method: "DELETE"
    });

    showMessage("adminMenuMessage", "Menu item deleted successfully.", "success");
    loadAdminMenuItems();
  } catch (error) {
    showMessage("adminMenuMessage", error.message, "error");
  }
}