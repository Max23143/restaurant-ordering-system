document.addEventListener("DOMContentLoaded", () => {
  setupBookingForm();
  loadMyBookings();
});

let editingBookingId = null;

function setupBookingForm() {
  const form = document.getElementById("bookingForm");
  if (!form) return;

  prefillBookingUserDetails();

  form.addEventListener("submit", submitBookingForm);
}

function prefillBookingUserDetails() {
  const currentUser = getCurrentUser();

  if (!currentUser) return;

  const fullNameInput = document.getElementById("fullName");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");

  if (fullNameInput) fullNameInput.value = currentUser.fullName || "";
  if (emailInput) emailInput.value = currentUser.email || "";
  if (phoneInput) phoneInput.value = currentUser.phone || "";
}

function formatDateForDateInput(value) {
  if (!value) return "";

  /*
    MongoDB date often comes like:
    2026-05-16T00:00:00.000Z

    HTML date input needs:
    2026-05-16
  */
  return String(value).split("T")[0];
}

async function submitBookingForm(event) {
  event.preventDefault();
  hideMessage("bookingMessage");

  if (!getToken()) {
    showMessage("bookingMessage", "Please log in before making a booking.", "error");
    return;
  }

  const submitBtn = document.getElementById("bookingSubmitBtn");

  const payload = {
    fullName: document.getElementById("fullName")?.value.trim() || "",
    email: document.getElementById("email")?.value.trim() || "",
    phone: document.getElementById("phone")?.value.trim() || "",
    bookingDate: document.getElementById("bookingDate")?.value || "",
    bookingTime: document.getElementById("bookingTime")?.value || "",
    guests: Number(document.getElementById("numberOfGuests")?.value || 0),
    notes: document.getElementById("notes")?.value.trim() || ""
  };

  if (
    !payload.fullName ||
    !payload.email ||
    !payload.phone ||
    !payload.bookingDate ||
    !payload.bookingTime ||
    !payload.guests
  ) {
    showMessage("bookingMessage", "Please fill all required booking fields.", "error");
    return;
  }

  if (payload.guests < 1) {
    showMessage("bookingMessage", "Number of guests must be at least 1.", "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = editingBookingId ? "Updating Booking..." : "Submitting Booking...";

  try {
    if (editingBookingId) {
      await apiRequest(`/bookings/my-bookings/${editingBookingId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      showMessage("bookingMessage", "Booking updated successfully.", "success");
    } else {
      await apiRequest("/bookings", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      showMessage("bookingMessage", "Booking submitted successfully.", "success");
    }

    resetBookingForm();
    loadMyBookings();
  } catch (error) {
    showMessage("bookingMessage", error.message || "Failed to save booking.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = editingBookingId ? "Update Booking" : "Submit Booking";
  }
}

function resetBookingForm() {
  const form = document.getElementById("bookingForm");
  if (!form) return;

  form.reset();
  editingBookingId = null;

  prefillBookingUserDetails();

  const submitBtn = document.getElementById("bookingSubmitBtn");
  if (submitBtn) {
    submitBtn.textContent = "Submit Booking";
  }

  const cancelEditBtn = document.getElementById("cancelBookingEditBtn");
  if (cancelEditBtn) {
    cancelEditBtn.classList.add("hide");
  }
}

async function loadMyBookings() {
  const mount = document.getElementById("myBookingsContainer");
  if (!mount) return;

  if (!getToken()) {
    mount.innerHTML = `<div class="empty-state">Log in to view your bookings.</div>`;
    return;
  }

  try {
    const response = await apiRequest("/bookings/my-bookings");
    const bookings = response.data || [];

    if (!bookings.length) {
      mount.innerHTML = `<div class="empty-state">No bookings found yet.</div>`;
      return;
    }

    mount.innerHTML = bookings.map((booking) => `
      <article class="card" style="margin-top: 1rem;">
        <div class="card-body">
          <h3 class="card-title">${booking.fullName}</h3>
          <p class="card-text">
            <strong>Date:</strong> ${formatDate(booking.bookingDate)}<br>
            <strong>Time:</strong> ${booking.bookingTime || "N/A"}<br>
            <strong>Guests:</strong> ${booking.guests || 0}<br>
            <strong>Phone:</strong> ${booking.phone || "N/A"}<br>
            <strong>Email:</strong> ${booking.email || "N/A"}<br>
            <strong>Status:</strong> ${booking.status || "pending"}<br>
            <strong>Notes:</strong> ${booking.notes || "None"}
          </p>

          <div class="inline-actions">
            <button class="btn btn-secondary" onclick="editBooking('${booking._id}')">Edit</button>
            <button class="btn btn-danger" onclick="deleteBooking('${booking._id}')">Delete</button>
          </div>
        </div>
      </article>
    `).join("");
  } catch (error) {
    mount.innerHTML = `<div class="empty-state">Failed to load bookings. ${error.message}</div>`;
  }
}

async function editBooking(id) {
  try {
    const response = await apiRequest("/bookings/my-bookings");
    const bookings = response.data || [];
    const booking = bookings.find((item) => item._id === id);

    if (!booking) {
      alert("Booking not found.");
      return;
    }

    editingBookingId = booking._id;

    document.getElementById("fullName").value = booking.fullName || "";
    document.getElementById("email").value = booking.email || "";
    document.getElementById("phone").value = booking.phone || "";
    document.getElementById("bookingDate").value = formatDateForDateInput(booking.bookingDate);
    document.getElementById("bookingTime").value = booking.bookingTime || "";
    document.getElementById("numberOfGuests").value = booking.guests || "";
    document.getElementById("notes").value = booking.notes || "";

    const submitBtn = document.getElementById("bookingSubmitBtn");
    if (submitBtn) {
      submitBtn.textContent = "Update Booking";
    }

    const cancelEditBtn = document.getElementById("cancelBookingEditBtn");
    if (cancelEditBtn) {
      cancelEditBtn.classList.remove("hide");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    alert(error.message || "Failed to load booking for editing.");
  }
}

async function deleteBooking(id) {
  const confirmed = window.confirm("Are you sure you want to delete this booking?");
  if (!confirmed) return;

  try {
    await apiRequest(`/bookings/my-bookings/${id}`, {
      method: "DELETE"
    });

    if (editingBookingId === id) {
      resetBookingForm();
    }

    await loadMyBookings();
    showMessage("bookingMessage", "Booking deleted successfully.", "success");
  } catch (error) {
    showMessage("bookingMessage", error.message || "Failed to delete booking.", "error");
  }
}