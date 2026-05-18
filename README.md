# Restaurant Ordering and Management System

## Project Title

**Design and Development of a Restaurant Ordering and Management System with Rule-Based Food Recommendation**

## Project Overview

This project is a full-stack web-based restaurant ordering and management system developed for a final-year computer science project. The aim of the system is to provide a restaurant-owned digital platform where customers can browse menu items, place food orders, book tables, submit reviews, view offers, and receive food suggestions. The system also provides an admin dashboard for managing restaurant operations such as menu items, customer orders, bookings, reviews, events, and promotional offers.

The project was developed to address the problem of small and medium-sized restaurants relying on manual or disconnected processes for menu management, order handling, table booking, and customer feedback. By combining customer-facing functions and administrative management into one system, the application supports better organisation, improved customer convenience, and more efficient restaurant workflow.

The system also includes a realistic rule-based recommendation and search suggestion feature. Instead of using a large machine learning model, the system uses explainable logic based on cuisine, category, flavour, tags, ratings, and keyword matching. This makes the recommendation feature feasible for a student project while still adding intelligent decision-support value.

---

## Main Aim

The aim of this project is to design, develop, and evaluate a web-based Restaurant Ordering and Management System with intelligent dish recommendation to improve customer convenience and restaurant operational efficiency.

---

## Project Objectives

The project was developed around the following objectives:

1. Investigate the current problems faced by restaurants using manual or disconnected ordering and management processes.
2. Review relevant academic and technical literature on online food ordering, restaurant digitalisation, usability, service quality, and recommender systems.
3. Define functional and non-functional requirements for customer and admin users.
4. Design a three-tier system architecture with clear separation between frontend, backend, and database layers.
5. Develop customer-facing functions including menu browsing, authentication, cart, order placement, booking, reviews, order history, and recommendations.
6. Develop admin-facing functions including dashboard, menu management, booking management, order management, review moderation, and event/offer management.
7. Implement a rule-based food recommendation and search suggestion feature.
8. Test the system using frontend testing, backend API testing, integration testing, and user-focused validation.
9. Evaluate the completed system against project objectives, requirements, limitations, and future improvements.

---

## Key Features

### Customer Features

- Customer registration and login
- Strong password guidance during registration and reset
- Secure JWT-based authentication
- Menu browsing with search and filters
- Dish details page with image, description, price, category, rating, and availability
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
- Admin dashboard with system overview
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

The recommendation feature is designed as a **rule-based food recommendation and search suggestion system**.

It works by comparing the user’s search query with menu item data such as:

- dish name
- description
- category
- cuisine
- flavour
- tags
- rating average
- review count

For example:

- If the user searches for **Italian food**, the system can suggest items related to pizza, pasta, spaghetti, lasagne, risotto, and similar terms.
- If the user searches for **spicy chicken**, the system can prioritise dishes matching spicy, chilli, pepper, masala, chicken, or related flavour terms.
- If the user searches for **English food**, the system can suggest items such as fish and chips, roast-style dishes, pies, or British-style food.

This approach is explainable and realistic for a single-restaurant system because it does not require complex machine learning infrastructure.

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
- MongoDB Atlas / local MongoDB connection
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
│   │   │
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── bookingController.js
│   │   │   ├── eventOfferController.js
│   │   │   ├── menuController.js
│   │   │   ├── orderController.js
│   │   │   ├── recommendationController.js
│   │   │   └── reviewController.js
│   │   │
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   ├── errorHandler.js
│   │   │   └── notFound.js
│   │   │
│   │   ├── models/
│   │   │   ├── Booking.js
│   │   │   ├── EventOffer.js
│   │   │   ├── MenuItem.js
│   │   │   ├── Order.js
│   │   │   ├── Review.js
│   │   │   └── User.js
│   │   │
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── bookingRoutes.js
│   │   │   ├── eventOfferRoutes.js
│   │   │   ├── index.js
│   │   │   ├── menuRoutes.js
│   │   │   ├── orderRoutes.js
│   │   │   ├── recommendationRoutes.js
│   │   │   └── reviewRoutes.js
│   │   │
│   │   ├── utils/
│   │   │   ├── ApiError.js
│   │   │   └── catchAsync.js
│   │   │
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── assets/
│   │   ├── css/
│   │   │   └── style.css
│   │   │
│   │   └── js/
│   │       ├── admin-bookings.js
│   │       ├── admin-dashboard.js
│   │       ├── admin-events.js
│   │       ├── admin-menu.js
│   │       ├── admin-orders.js
│   │       ├── admin-reviews.js
│   │       ├── api.js
│   │       ├── auth.js
│   │       ├── booking.js
│   │       ├── cart.js
│   │       ├── events.js
│   │       ├── index.js
│   │       ├── menu.js
│   │       ├── order-history.js
│   │       ├── payment.js
│   │       ├── recommendation.js
│   │       └── reviews.js
│   │
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
├── netlify.toml
└── README.md
