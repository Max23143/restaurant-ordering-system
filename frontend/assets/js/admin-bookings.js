document.addEventListener("DOMContentLoaded", () => {
  loadAdminBookings();

  const refreshBtn = document.getElementById("refreshBookingsBtn");
  if (refreshBtn) refreshBtn.addEventListener("click", loadAdminBookings);
});

async function loadAdminBookings() {
  const mount = document.getElementById("adminBookingsContainer") || document.getElementById("bookingsContainer");
  const statusFilter = document.getElementById("bookingStatusFilter");
  const dateFilter = document.getElementById("bookingDateFilter");

  if (!mount) return;

  try {
    const query = new URLSearchParams();

    if (statusFilter?.value) query.append("status", statusFilter.value);
    if (dateFilter?.value) query.append("bookingDate", dateFilter.value);

    const endpoint = query.toString()
      ? `/bookings/admin/all?${query.toString()}`
      : "/bookings/admin/all";

    const response = await apiRequest(endpoint);
    const bookings = response.data || [];

    if (!bookings.length) {
      mount.innerHTML = `<div class="empty-state">No bookings found.</div>`;
      return;
    }

    mount.innerHTML = bookings.map((booking) => `
      <article class="card" style="margin-bottom: 1rem;">
        <div class="card-body">
          <h3 class="card-title">${booking.fullName}</h3>
          <p class="card-text">
            <strong>Date:</strong> ${booking.bookingDate || "N/A"}<br>
            <strong>Time:</strong> ${booking.bookingTime || "N/A"}<br>
            <strong>Guests:</strong> ${booking.guests || 0}<br>
            <strong>Email:</strong> ${booking.email || "N/A"}<br>
            <strong>Status:</strong> ${booking.status || "Pending"}
          </p>

          <div class="inline-actions">
            <select onchange="updateAdminBookingStatus('${booking._id}', this.value)">
              <option value="">Change Status</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </article>
    `).join("");
  } catch (error) {
    mount.innerHTML = `<div class="empty-state">Failed to load bookings. ${error.message}</div>`;
  }
}

async function updateAdminBookingStatus(id, status) {
  if (!status) return;

  try {
    await apiRequest(`/bookings/admin/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status })
    });

    loadAdminBookings();
  } catch (error) {
    alert(error.message || "Failed to update booking status.");
  }
}