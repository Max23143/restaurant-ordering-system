document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("bookingForm").addEventListener("submit", submitBooking);
});

async function submitBooking(event) {
  event.preventDefault();
  hideMessage("bookingMessage");

  const payload = {
    customerName: document.getElementById("customerName").value.trim(),
    email: document.getElementById("email").value.trim(),
    bookingDate: document.getElementById("bookingDate").value,
    bookingTime: document.getElementById("bookingTime").value,
    numberOfGuests: Number(document.getElementById("numberOfGuests").value),
    specialRequest: document.getElementById("specialRequest").value.trim()
  };

  try {
    await apiRequest("/bookings", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    showMessage("bookingMessage", "Booking submitted successfully.", "success");
    event.target.reset();
  } catch (error) {
    showMessage("bookingMessage", error.message, "error");
  }
}