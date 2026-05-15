document.addEventListener("DOMContentLoaded", () => {
  setupAdminMenuForm();
  loadAdminMenuItems();
});

let editingMenuItemId = null;

function setupAdminMenuForm() {
  const form = document.getElementById("adminMenuForm") || document.getElementById("menuForm");
  if (!form) return;

  form.addEventListener("submit", submitAdminMenuForm);
}

async function loadAdminMenuItems() {
  const mount =
    document.getElementById("adminMenuItemsContainer") ||
    document.getElementById("currentMenuItemsContainer") ||
    document.getElementById("menuItemsContainer");

  if (!mount) return;

  try {
    const response = await apiRequest("/menu");
    const items = (response.data || []).map(normalizeMenuItem);

    if (!items.length) {
      mount.innerHTML = `<div class="empty-state">No menu items found.</div>`;
      return;
    }

    mount.innerHTML = items.map((item) => `
      <article class="card" style="margin-bottom: 1rem;">
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

  const messageId = "adminMenuMessage";
  hideMessage(messageId);

  const name = document.getElementById("dishName")?.value.trim() || document.getElementById("name")?.value.trim() || "";
  const category = document.getElementById("category")?.value || "";
  const price = Number(document.getElementById("price")?.value || 0);
  const image = document.getElementById("imageUrl")?.value.trim() || document.getElementById("image")?.value.trim() || "";
  const description = document.getElementById("description")?.value.trim() || "";
  const tagsRaw = document.getElementById("tags")?.value.trim() || "";
  const isAvailable = document.getElementById("isAvailable")?.checked ?? true;

  const payload = {
    name,
    category,
    price,
    image,
    description,
    tags: tagsRaw
      ? tagsRaw.split(",").map((tag) => tag.trim()).filter(Boolean)
      : [],
    isAvailable
  };

  try {
    if (editingMenuItemId) {
      await apiRequest(`/menu/${editingMenuItemId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      showMessage(messageId, "Menu item updated successfully.", "success");
    } else {
      await apiRequest("/menu", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      showMessage(messageId, "Menu item added successfully.", "success");
    }

    resetAdminMenuForm();
    loadAdminMenuItems();
  } catch (error) {
    showMessage(messageId, error.message || "Failed to save menu item.", "error");
  }
}

async function editAdminMenuItem(id) {
  try {
    const response = await apiRequest(`/menu/${id}`);
    const item = normalizeMenuItem(response.data || {});
    editingMenuItemId = item._id;

    const dishName = document.getElementById("dishName") || document.getElementById("name");
    const category = document.getElementById("category");
    const price = document.getElementById("price");
    const imageUrl = document.getElementById("imageUrl") || document.getElementById("image");
    const description = document.getElementById("description");
    const tags = document.getElementById("tags");
    const isAvailable = document.getElementById("isAvailable");
    const submitBtn = document.getElementById("adminMenuSubmitBtn") || document.getElementById("menuSubmitBtn");

    if (dishName) dishName.value = item.name;
    if (category) category.value = item.category;
    if (price) price.value = item.price;
    if (imageUrl) imageUrl.value = item.image;
    if (description) description.value = item.description;
    if (tags) tags.value = (item.tags || []).join(", ");
    if (isAvailable) isAvailable.checked = item.isAvailable;
    if (submitBtn) submitBtn.textContent = "Update Menu Item";

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    alert(error.message || "Failed to load item for editing.");
  }
}

async function deleteAdminMenuItem(id) {
  if (!window.confirm("Are you sure you want to delete this menu item?")) return;

  try {
    await apiRequest(`/menu/${id}`, { method: "DELETE" });
    loadAdminMenuItems();
  } catch (error) {
    alert(error.message || "Failed to delete menu item.");
  }
}

function resetAdminMenuForm() {
  const form = document.getElementById("adminMenuForm") || document.getElementById("menuForm");
  const submitBtn = document.getElementById("adminMenuSubmitBtn") || document.getElementById("menuSubmitBtn");

  if (form) form.reset();
  editingMenuItemId = null;
  if (submitBtn) submitBtn.textContent = "Save Menu Item";
}