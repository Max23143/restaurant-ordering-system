# Restaurant Ordering and Management System

## Project Title

**Design and Development of a Restaurant Ordering and Management System with Rule-Based Food Recommendation**

## Project Overview

This project is a full-stack web-based restaurant ordering and management system developed as a final-year computer science project. The system provides a restaurant-owned digital platform where customers can browse menu items, place food orders, book tables, submit reviews, view events/offers, and receive food suggestions. It also provides an admin dashboard for managing menu items, orders, bookings, reviews, restaurant events, and promotional offers.

The project addresses the problem of restaurants relying on manual or disconnected processes for menu management, order handling, table bookings, customer feedback, and promotional updates. By combining customer-facing functionality and administrative management into one system, the application improves customer convenience and supports more organised restaurant operations.

The system includes a **rule-based food recommendation and search suggestion feature**. Instead of using a large machine learning model, the recommendation feature uses explainable matching logic based on cuisine, category, flavour, tags, description, rating, and keyword expansion. This keeps the feature realistic for a single-restaurant final-year project while still adding intelligent decision-support value.

---

## Main Aim

The aim of this project is to design, develop, and evaluate a web-based Restaurant Ordering and Management System with an intelligent dish suggestion feature to improve customer convenience and restaurant operational efficiency.

---

## Project Objectives

1. Investigate current problems faced by restaurants using manual or disconnected ordering and management processes.
2. Review academic and technical literature on online food ordering, restaurant digitalisation, usability, service quality, and recommender systems.
3. Define functional and non-functional requirements for customer and admin users.
4. Design a three-tier system architecture with clear separation between frontend, backend, and database layers.
5. Develop customer-facing functions including menu browsing, authentication, cart, order placement, booking, reviews, order history, events/offers, and recommendations.
6. Develop admin-facing functions including dashboard, menu management, order management, booking management, review moderation, and event/offer management.
7. Implement a rule-based food recommendation and search suggestion feature.
8. Test the system using frontend testing, backend API testing, integration testing, and user-focused validation.
9. Evaluate the completed system against the project objectives, requirements, limitations, and future improvements.

---

## Key Features

### Customer Features

- Customer registration and login
- Strong password guidance during registration and reset
- JWT-based authentication
- Menu browsing with search and filtering
- Dish details with image, description, price, category, rating, and availability
- Add-to-cart functionality
- Cart quantity update and item removal
- Cash checkout
- Separate simulated online card payment page
- Order history view
- Table booking/reservation
- Edit and delete existing bookings
- Review and rating submission
- Events and offers page
- Rule-based food recommendation/search suggestion

### Admin Features

- Secure admin login
- Admin dashboard with overview counts
- Add, edit, and delete menu items
- Manage customer orders
- Update order status
- Manage table bookings
- Update booking status
- View and moderate reviews
- Add, edit, and delete restaurant events and promotional offers
- Manage active/inactive events and offers

---

## Recommendation Feature

The recommendation feature is implemented as a **rule-based food recommendation and search suggestion system**.

It compares a customer's query with menu item fields such as:

- dish name
- description
- category
- cuisine
- flavours
- tags
- rating average
- review count

Examples:

- Searching **Italian food** can suggest pizza, pasta, spaghetti, lasagne, risotto, and related menu items.
- Searching **spicy chicken** can prioritise dishes matching spicy, hot, chilli, pepper, masala, and chicken-related terms.
- Searching **English food** can suggest dishes such as fish and chips, roast-style dishes, pies, or British-style items.

This is intentionally explainable and suitable for a small restaurant prototype because it does not require a large user-history dataset or complex machine learning infrastructure.

---

## Technology Stack

### Frontend

- HTML5
- CSS3
- JavaScript

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token authentication
- bcrypt password hashing

### Tools

- Visual Studio Code
- Git and GitHub
- Postman for API testing
- draw.io for diagrams
- MongoDB Atlas/local MongoDB
- Browser developer tools

---

## Project Folder Structure

```text
restaurant-ordering-system/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── assets/
│   │   ├── css/
│   │   └── js/
│   ├── admin-bookings.html
│   ├── admin-dashboard.html
│   ├── admin-events.html
│   ├── admin-menu.html
│   ├── admin-orders.html
│   ├── admin-reviews.html
│   ├── booking.html
│   ├── cart.html
│   ├── events.html
│   ├── forgot-password.html
│   ├── index.html
│   ├── login.html
│   ├── menu.html
│   ├── order-history.html
│   ├── payment.html
│   ├── register.html
│   ├── reset-password.html
│   └── reviews.html
│
├── docs/
│   ├── README.md
│   ├── gantt-chart.md
│   ├── viva-demo-checklist.md
│   └── postman/
│       └── README.md
│
├── netlify.toml
└── README.md
```

---

### Health

```text
GET /api/health
```

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/me
```

### Menu

```text
GET    /api/menu
GET    /api/menu/:id
POST   /api/menu
PUT    /api/menu/:id
DELETE /api/menu/:id
```

### Orders

```text
POST /api/orders
GET  /api/orders/my-orders
GET  /api/orders/my-orders/:id
GET  /api/orders/admin/all
GET  /api/orders/admin/:id
PUT  /api/orders/admin/:id/status
```

### Bookings

```text
POST   /api/bookings
GET    /api/bookings/my-bookings
PUT    /api/bookings/my-bookings/:id
DELETE /api/bookings/my-bookings/:id
GET    /api/bookings/admin/all
PUT    /api/bookings/admin/:id/status
```

### Reviews

```text
POST   /api/reviews
GET    /api/reviews/my-reviews
PUT    /api/reviews/my-reviews/:id
DELETE /api/reviews/my-reviews/:id
GET    /api/reviews/menu/:menuItemId
GET    /api/reviews/admin/all
PUT    /api/reviews/admin/:id/toggle-approval
```

### Recommendations

```text
GET /api/recommendations/top-rated
GET /api/recommendations/personalized
GET /api/recommendations/menu/:menuItemId
GET /api/recommendations/search?query=italian food
```

### Events and Offers

```text
GET    /api/events-offers
GET    /api/events-offers?type=event
GET    /api/events-offers?type=offer
POST   /api/events-offers/admin
PUT    /api/events-offers/admin/:id
DELETE /api/events-offers/admin/:id
```

---

