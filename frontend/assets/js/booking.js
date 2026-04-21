document.addEventListener("DOMContentLoaded", () => {
  const bookingForm = document.getElementById("bookingForm");
  if (!bookingForm) return;

  prefillBookingForm();
  bookingForm.addEventListener("submit", submitBooking);
});

function prefillBookingForm() {
  const user = getCurrentUser();
  if (!user) return;

  const fullNameInput = document.getElementById("bookingFullName");
  const emailInput = document.getElementById("bookingEmail");
  const phoneInput = document.getElementById("bookingPhone");

  if (fullNameInput) {
    fullNameInput.value = user.fullName || user.name || "";
  }

  if (emailInput) {
    emailInput.value = user.email || "";
  }

  if (phoneInput) {
    phoneInput.value = user.phone || "";
  }
}

async function submitBooking(event) {
  event.preventDefault();
  hideMessage("bookingMessage");

  if (!getToken()) {
    showMessage("bookingMessage", "Please log in before making a booking.", "error");
    setTimeout(() => {
      window.location.href = buildFrontendUrl("login.html");
    }, 700);
    return;
  }

  const bookingBtn = document.getElementById("bookingBtn");

  const fullName = document.getElementById("bookingFullName").value.trim();
  const email = document.getElementById("bookingEmail").value.trim();
  const phone = document.getElementById("bookingPhone").value.trim();
  const bookingDate = document.getElementById("bookingDate").value;
  const bookingTime = document.getElementById("bookingTime").value;
  const guests = Number(document.getElementById("bookingGuests").value);
  const notes = document.getElementById("bookingNotes").value.trim();

  if (!fullName || !email || !phone || !bookingDate || !bookingTime || !guests) {
    showMessage(
      "bookingMessage",
      "Full name, email, phone, booking date, booking time, and guests are required.",
      "error"
    );
    return;
  }

  if (guests < 1) {
    showMessage("bookingMessage", "Guests must be at least 1.", "error");
    return;
  }

  bookingBtn.disabled = true;
  bookingBtn.textContent = "Submitting...";

  try {
    await apiRequest("/bookings", {
      method: "POST",
      body: JSON.stringify({
        fullName,
        email,
        phone,
        bookingDate,
        bookingTime,
        guests,
        notes
      })
    });

    showMessage("bookingMessage", "Booking submitted successfully.", "success");
    document.getElementById("bookingForm").reset();
    prefillBookingForm();
  } catch (error) {
    showMessage("bookingMessage", error.message || "Booking failed.", "error");
  } finally {
    bookingBtn.disabled = false;
    bookingBtn.textContent = "Submit Booking";
  }
}