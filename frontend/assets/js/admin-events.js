document.addEventListener("DOMContentLoaded", () => {
  setupEventOfferForm();
  loadAdminEventOffers();

  const resetBtn = document.getElementById("eventOfferResetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", resetEventOfferForm);
  }
});

let editingEventOfferId = null;

function setupEventOfferForm() {
  const form = document.getElementById("eventOfferForm");
  if (!form) return;

  form.addEventListener("submit", submitEventOfferForm);
}

async function loadAdminEventOffers() {
  const mount = document.getElementById("adminEventOfferList");
  if (!mount) return;

  try {
    const response = await apiRequest("/events-offers?active=all");
    const items = response.data || [];

    if (!items.length) {
      mount.innerHTML = `<div class="empty-state">No events or offers found.</div>`;
      return;
    }

    mount.innerHTML = items.map((item) => `
      <article class="card" style="margin-bottom: 1rem;">
        <div class="card-body">
          ${item.image ? `<img src="${item.image}" alt="${item.title}" style="height:160px;width:100%;object-fit:cover;border-radius:16px;margin-bottom:1rem;">` : ""}
          <div class="meta-row">
            <span class="badge">${item.type}</span>
            <span class="badge ${item.isActive ? "badge-success" : "badge-muted"}">
              ${item.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <h3 class="card-title">${item.title}</h3>
          <p class="card-text">
            <strong>Date:</strong> ${item.dateLabel || "N/A"}<br>
            <strong>Time:</strong> ${item.timeLabel || "N/A"}<br>
            <strong>Discount:</strong> ${item.discountLabel || "N/A"}<br>
            <strong>Display Order:</strong> ${item.displayOrder || 0}<br>
            <strong>Description:</strong> ${item.description}
          </p>

          <div class="inline-actions">
            <button class="btn btn-secondary" onclick="editEventOffer('${item._id}')">Edit</button>
            <button class="btn btn-danger" onclick="deleteEventOffer('${item._id}')">Delete</button>
          </div>
        </div>
      </article>
    `).join("");
  } catch (error) {
    mount.innerHTML = `<div class="empty-state">Failed to load events/offers. ${error.message}</div>`;
  }
}

async function submitEventOfferForm(event) {
  event.preventDefault();
  hideMessage("adminEventOfferMessage");

  const payload = {
    type: document.getElementById("eventOfferType")?.value || "event",
    title: document.getElementById("eventOfferTitle")?.value.trim() || "",
    description: document.getElementById("eventOfferDescription")?.value.trim() || "",
    dateLabel: document.getElementById("eventOfferDateLabel")?.value.trim() || "",
    timeLabel: document.getElementById("eventOfferTimeLabel")?.value.trim() || "",
    discountLabel: document.getElementById("eventOfferDiscountLabel")?.value.trim() || "",
    image: document.getElementById("eventOfferImage")?.value.trim() || "",
    displayOrder: Number(document.getElementById("eventOfferDisplayOrder")?.value || 0),
    isActive: document.getElementById("eventOfferActive")?.checked ?? true
  };

  if (!payload.title || !payload.description) {
    showMessage("adminEventOfferMessage", "Title and description are required.", "error");
    return;
  }

  const submitBtn = document.getElementById("eventOfferSubmitBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = editingEventOfferId ? "Updating..." : "Saving...";

  try {
    if (editingEventOfferId) {
      await apiRequest(`/events-offers/admin/${editingEventOfferId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      showMessage("adminEventOfferMessage", "Event/offer updated successfully.", "success");
    } else {
      await apiRequest("/events-offers/admin", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      showMessage("adminEventOfferMessage", "Event/offer created successfully.", "success");
    }

    resetEventOfferForm();
    loadAdminEventOffers();
  } catch (error) {
    showMessage("adminEventOfferMessage", error.message || "Failed to save event/offer.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Save";
  }
}

async function editEventOffer(id) {
  try {
    const response = await apiRequest(`/events-offers/${id}`);
    const item = response.data;

    editingEventOfferId = item._id;

    document.getElementById("eventOfferId").value = item._id;
    document.getElementById("eventOfferType").value = item.type || "event";
    document.getElementById("eventOfferTitle").value = item.title || "";
    document.getElementById("eventOfferDescription").value = item.description || "";
    document.getElementById("eventOfferDateLabel").value = item.dateLabel || "";
    document.getElementById("eventOfferTimeLabel").value = item.timeLabel || "";
    document.getElementById("eventOfferDiscountLabel").value = item.discountLabel || "";
    document.getElementById("eventOfferImage").value = item.image || "";
    document.getElementById("eventOfferDisplayOrder").value = item.displayOrder || 0;
    document.getElementById("eventOfferActive").checked = item.isActive !== false;

    document.getElementById("eventOfferSubmitBtn").textContent = "Update";

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    alert(error.message || "Failed to load event/offer.");
  }
}

async function deleteEventOffer(id) {
  const confirmed = window.confirm("Are you sure you want to delete this event/offer?");
  if (!confirmed) return;

  try {
    await apiRequest(`/events-offers/admin/${id}`, {
      method: "DELETE"
    });

    if (editingEventOfferId === id) {
      resetEventOfferForm();
    }

    loadAdminEventOffers();
    showMessage("adminEventOfferMessage", "Event/offer deleted successfully.", "success");
  } catch (error) {
    showMessage("adminEventOfferMessage", error.message || "Failed to delete event/offer.", "error");
  }
}

function resetEventOfferForm() {
  const form = document.getElementById("eventOfferForm");
  if (form) form.reset();

  editingEventOfferId = null;

  const hiddenId = document.getElementById("eventOfferId");
  if (hiddenId) hiddenId.value = "";

  const active = document.getElementById("eventOfferActive");
  if (active) active.checked = true;

  const submitBtn = document.getElementById("eventOfferSubmitBtn");
  if (submitBtn) submitBtn.textContent = "Save";
}