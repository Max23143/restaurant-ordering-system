document.addEventListener("DOMContentLoaded", () => {
  renderRestaurantEvents();
  renderRestaurantOffers();
});

/*
  Static events data for the frontend.
  This is suitable for your current project stage.
  Later, this can be moved into MongoDB and managed by admin.
*/
const restaurantEvents = [
  {
    title: "Live Music Friday",
    date: "Every Friday",
    time: "7:00 PM - 10:00 PM",
    description: "Enjoy dinner with live acoustic music from local performers.",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "Family Sunday Dinner",
    date: "Every Sunday",
    time: "4:00 PM - 8:00 PM",
    description: "A family-friendly evening with group meal deals and kids' menu options.",
    image: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "Chef’s Special Night",
    date: "Last Saturday of the Month",
    time: "6:00 PM - 9:30 PM",
    description: "Try limited-edition dishes prepared specially by the restaurant chef.",
    image: "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1200&q=80"
  }
];

const restaurantOffers = [
  {
    title: "Student Lunch Discount",
    discount: "20% OFF",
    description: "Students get 20% off selected lunch meals between 12 PM and 3 PM."
  },
  {
    title: "Birthday Table Offer",
    discount: "Free Dessert",
    description: "Book a birthday table and receive one complimentary dessert."
  },
  {
    title: "Family Booking Offer",
    discount: "Free Drinks",
    description: "Book a table for 4 or more guests and receive complimentary soft drinks."
  }
];

function renderRestaurantEvents() {
  const mount = document.getElementById("eventsContainer");
  if (!mount) return;

  mount.innerHTML = restaurantEvents.map((event) => `
    <article class="event-card">
      <img src="${event.image}" alt="${event.title}">
      <div class="event-card-body">
        <span class="badge badge-success">${event.date}</span>
        <h3>${event.title}</h3>
        <p><strong>Time:</strong> ${event.time}</p>
        <p>${event.description}</p>
      </div>
    </article>
  `).join("");
}

function renderRestaurantOffers() {
  const mount = document.getElementById("offersContainer");
  if (!mount) return;

  mount.innerHTML = restaurantOffers.map((offer) => `
    <article class="offer-card">
      <span class="badge badge-success">${offer.discount}</span>
      <h3>${offer.title}</h3>
      <p>${offer.description}</p>
    </article>
  `).join("");
}