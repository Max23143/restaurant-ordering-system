document.addEventListener("DOMContentLoaded", () => {
  setupAdminMenuForm();
  loadAdminMenuItems();

  const resetBtn = document.getElementById("resetMenuFormBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", resetAdminMenuForm);
  }
});

let editingMenuItemId = null;

function setupAdminMenuForm() {
  const form = document.getElementById("menuForm");
  if (!form) return;

  form.addEventListener("submit", submitAdminMenuForm);
}

async function loadAdminMenuItems() {
  const mount = document.getElementById("adminMenuList");
  if (!mount) return;

  try {
    const response = await apiRequest("/menu");
    const items = (response.data || []).map(normalizeMenuItem);

    if (!items.length) {
      mount.innerHTML = `<div class="empty-state">No menu items found.</div>`;
      return;
    }

    mount.innerHTML = items.map((item) => `
      <article class="card" style="margin-bottom:1rem;">
        <div class="card-body">
          <img src="${item.image}" alt="${item.name}" style="width:100%;height:180px;object-fit:cover;border-radius:16px;margin-bottom:1rem;">
          <h3 class="card-title">${item.name}</h3>
          <p class="card-text">
            <strong>Category:</strong> ${item.category}<br>
            <strong>Price:</strong> ${formatCurrency(item.price)}<br>
            <strong>Available:</strong> ${item.isAvailable ? "Yes" : "No"}<br>
            <strong>Description:</strong> ${item.description}<br>
            <strong>Tags:</strong> ${(item.tags || []).join(", ") || "None"}
          </p>

          <div class="inline-actions">
            <button class="btn btn-secondary" onclick="editAdminMenuItem('${item._id}')">Edit</button>
            <button class="btn btn-danger" onclick="deleteAdminMenuItem('${item._id}')">Delete</button>
          </div>
        </div>
      </article>
    `).join("");
  } catch (error) {
    mount.innerHTML = `<div class="empty-state">Failed to load menu items. ${error.message}</div>`;
  }
}

async function submitAdminMenuForm(event) {
  event.preventDefault();
  hideMessage("adminMenuMessage");

  const payload = {
    name: document.getElementById("menuName")?.value.trim() || "",
    category: document.getElementById("menuCategory")?.value || "",
    price: Number(document.getElementById("menuPrice")?.value || 0),
    image: document.getElementById("menuImage")?.value.trim() || "",
    description: document.getElementById("menuDescription")?.value.trim() || "",
    tags: (document.getElementById("menuTags")?.value || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    isAvailable: document.getElementById("menuAvailable")?.checked ?? true
  };

  try {
    if (editingMenuItemId) {
      await apiRequest(`/menu/${editingMenuItemId}`, {
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

    resetAdminMenuForm();
    loadAdminMenuItems();
  } catch (error) {
    showMessage("adminMenuMessage", error.message || "Failed to save menu item.", "error");
  }
}

async function editAdminMenuItem(id) {
  try {
    const response = await apiRequest(`/menu/${id}`);
    const item = normalizeMenuItem(response.data || {});
    editingMenuItemId = item._id;

    document.getElementById("menuItemId").value = item._id;
    document.getElementById("menuName").value = item.name;
    document.getElementById("menuCategory").value = item.category;
    document.getElementById("menuPrice").value = item.price;
    document.getElementById("menuImage").value = item.image;
    document.getElementById("menuDescription").value = item.description;
    document.getElementById("menuTags").value = (item.tags || []).join(", ");
    document.getElementById("menuAvailable").checked = item.isAvailable;

    const submitBtn = document.getElementById("menuSubmitBtn");
    if (submitBtn) submitBtn.textContent = "Update Item";

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    alert(error.message || "Failed to load menu item.");
  }
}

async function deleteAdminMenuItem(id) {
  if (!window.confirm("Are you sure you want to delete this menu item?")) return;

  try {
    await apiRequest(`/menu/${id}`, { method: "DELETE" });
    loadAdminMenuItems();
    showMessage("adminMenuMessage", "Menu item deleted successfully.", "success");
  } catch (error) {
    showMessage("adminMenuMessage", error.message || "Failed to delete menu item.", "error");
  }
}

function resetAdminMenuForm() {
  const form = document.getElementById("menuForm");
  if (form) form.reset();

  editingMenuItemId = null;

  const hiddenId = document.getElementById("menuItemId");
  if (hiddenId) hiddenId.value = "";

  const submitBtn = document.getElementById("menuSubmitBtn");
  if (submitBtn) submitBtn.textContent = "Save Item";
}