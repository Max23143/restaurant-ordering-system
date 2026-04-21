document.addEventListener("DOMContentLoaded", () => {
  if (!protectAdminBookingsPage()) return;

  document.getElementById("refreshBookingsBtn").addEventListener("click", loadAdminBookings);
  document.getElementById("bookingStatusFilter").addEventListener("change", loadAdminBookings);
  document.getElementById("bookingDateFilter").addEventListener("change", loadAdminBookings);

  loadAdminBookings();
});

function protectAdminBookingsPage() {
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

async function loadAdminBookings() {
  const mount = document.getElementById("adminBookingsTable");
  if (!mount) return;

  const status = document.getElementById("bookingStatusFilter").value;
  const date = document.getElementById("bookingDateFilter").value;

  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (date) params.append("date", date);

  const endpoint = params.toString()
    ? `/bookings/admin/all?${params.toString()}`
    : "/bookings/admin/all";

  try {
    const response = await apiRequest(endpoint);
    const bookings = response.data || [];

    if (!bookings.length) {
      mount.innerHTML = `<div class="empty-state">No bookings found.</div>`;
      return;
    }

    mount.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Date</th>
              <th>Time</th>
              <th>Guests</th>
              <th>Status</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            ${bookings.map((booking) => `
              <tr>
                <td>${booking.fullName || booking.user?.fullName || "N/A"}</td>
                <td>${booking.email || booking.user?.email || "N/A"}</td>
                <td>${booking.phone || booking.user?.phone || "N/A"}</td>
                <td>${formatDate(booking.bookingDate)}</td>
                <td>${booking.bookingTime || "N/A"}</td>
                <td>${booking.guests || "N/A"}</td>
                <td>${capitalizeBookingText(booking.status || "pending")}</td>
                <td>
                  <select onchange="updateBookingStatus('${booking._id}', this.value)">
                    <option value="">Change status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    mount.innerHTML = `<div class="empty-state">Failed to load bookings. ${error.message}</div>`;
  }
}

async function updateBookingStatus(bookingId, status) {
  if (!status) return;

  try {
    await apiRequest(`/bookings/admin/${bookingId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status })
    });

    showMessage("adminBookingMessage", "Booking status updated successfully.", "success");
    loadAdminBookings();
  } catch (error) {
    showMessage("adminBookingMessage", error.message || "Failed to update booking status.", "error");
  }
}

function capitalizeBookingText(value = "") {
  if (!value) return "N/A";
  return value.charAt(0).toUpperCase() + value.slice(1);
}