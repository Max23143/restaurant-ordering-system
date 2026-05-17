document.addEventListener("DOMContentLoaded", () => {
  loadRestaurantEvents();
  loadRestaurantOffers();
});

/*
  Loads active events from database.
  New admin-added events will appear automatically.
*/
async function loadRestaurantEvents() {
  const mount = document.getElementById("eventsContainer");
  if (!mount) return;

  try {
    const response = await apiRequest("/events-offers?type=event");
    const events = response.data || [];

    if (!events.length) {
      mount.innerHTML = `<div class="empty-state">No active events available.</div>`;
      return;
    }

    mount.innerHTML = events.map(renderEventCard).join("");
  } catch (error) {
    mount.innerHTML = `<div class="empty-state">Failed to load events. ${error.message}</div>`;
  }
}

/*
  Loads active offers from database.
  New admin-added offers will appear automatically.
*/
async function loadRestaurantOffers() {
  const mount = document.getElementById("offersContainer");
  if (!mount) return;

  try {
    const response = await apiRequest("/events-offers?type=offer");
    const offers = response.data || [];

    if (!offers.length) {
      mount.innerHTML = `<div class="empty-state">No active offers available.</div>`;
      return;
    }

    mount.innerHTML = offers.map(renderOfferCard).join("");
  } catch (error) {
    mount.innerHTML = `<div class="empty-state">Failed to load offers. ${error.message}</div>`;
  }
}

function renderEventCard(event) {
  return `
    <article class="event-card">
      ${event.image ? `<img src="${event.image}" alt="${event.title}" class="event-card-image">` : ""}
      <div class="event-card-body">
        <span class="badge badge-success">${event.dateLabel || "Event"}</span>
        <h3>${event.title}</h3>
        <p><strong>Time:</strong> ${event.timeLabel || "N/A"}</p>
        <p>${event.description}</p>
      </div>
    </article>
  `;
}

function renderOfferCard(offer) {
  return `
    <article class="offer-card">
      ${offer.image ? `<img src="${offer.image}" alt="${offer.title}" class="offer-card-image">` : ""}
      <div class="offer-card-body">
        <span class="badge badge-success">${offer.discountLabel || "Offer"}</span>
        <h3>${offer.title}</h3>
        <p>${offer.description}</p>
        ${offer.dateLabel ? `<p><strong>Available:</strong> ${offer.dateLabel}</p>` : ""}
      </div>
    </article>
  `;
}