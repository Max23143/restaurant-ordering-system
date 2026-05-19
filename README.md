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

## Backend Setup Instructions

### 1. Open the backend folder

```bash
cd backend
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Create the environment file

Copy the example file:

```bash
copy .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

Then update `.env` with your own MongoDB connection string and JWT secret.

Example:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your_jwt_secret_here
CLIENT_URL=http://127.0.0.1:5500
CLIENT_URL_2=http://localhost:5500
CLIENT_URL_3=https://your-deployed-frontend-url-here
```

Important: never push the real `.env` file to GitHub because it contains private configuration values.

### 4. Run the backend server

```bash
npm run dev
```

Expected result:

```text
Server running on port 5000
MongoDB connected successfully
```

### 5. Test the backend health endpoint

```text
GET http://127.0.0.1:5000/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "API is healthy"
}
```

---

## Frontend Setup Instructions

The frontend is built using HTML, CSS, and JavaScript.

### Recommended method: VS Code Live Server

1. Open the project in Visual Studio Code.
2. Open the `frontend` folder.
3. Right-click `index.html`.
4. Select **Open with Live Server**.

Expected frontend URL:

```text
http://127.0.0.1:5500/index.html
```

Live Server is recommended because it avoids some browser path and CORS issues.

---

## API Base URL

Local backend:

```text
http://127.0.0.1:5000/api
```

The frontend helper script selects the local API while running on localhost and can use the deployed backend when the frontend is deployed.

---

## Main API Endpoints

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

## Authentication and Roles

The system uses JWT authentication. When a user logs in successfully, the backend returns a token and user details. The frontend stores these in `localStorage` so that protected pages can send the token in the request header.

There are two main roles:

```text
customer
admin
```

Customers can browse menu items, place orders, make bookings, submit reviews, and view their own orders. Admin users can manage menu items, orders, bookings, reviews, events, and offers.

---

## Checkout and Payment Flow

The system supports two payment methods.

### Cash Payment

The customer selects **Cash** during checkout. The order is created directly and payment is collected in person.

### Simulated Online Card Payment

The customer selects **Online/Card** during checkout. The cart page stores a pending order and redirects the customer to `payment.html`. The customer then enters card-holder name, card number, expiry month, expiry year, and CVV. After validation, the order is created.

This payment feature is for academic demonstration only. It does not process real payments through Stripe, PayPal, or a banking provider. The backend does not store the full card number or CVV; it stores only safe reference information such as the card holder name and last four digits.

---

## Testing Summary

Testing was carried out using frontend browser testing and backend API testing with Postman.

### Frontend Testing

- Home page and navigation
- Menu page display, search, and filters
- Customer registration and strong-password feedback
- Login and role-based navigation
- Forgot password and reset PIN flow
- Cart quantity update and item removal
- Cash checkout
- Simulated online card payment page
- Booking create, edit, and delete
- Review submission
- Events and offers display
- Admin dashboard
- Admin menu CRUD
- Admin order status management
- Admin booking status management
- Admin review moderation
- Admin event/offer CRUD

### Backend API Testing

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- invalid login test
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/menu`
- menu search query
- menu create/update/delete
- booking create/get/update/delete
- order creation
- online order creation with payment details
- customer order history
- admin order list
- admin order status update
- review creation
- recommendation search
- event/offer create/get/update/delete

---

## Security and Validation Features

- Password hashing using bcrypt
- JWT authentication for protected routes
- Role-based admin access control
- Strong password validation
- Duplicate email and phone checks
- Backend-side order total calculation
- Simulated card validation for online payment
- Full card number and CVV are not stored
- Protected customer order and booking routes
- Admin-only management routes
- Centralised error handling
- Required-field and invalid-ID validation

---

## Known Limitations

- Online card payment is simulated and does not use a real payment gateway.
- Forgot password uses a generated PIN for demonstration instead of real email/SMS delivery.
- The recommendation system is rule-based rather than a trained machine learning model.
- The system is designed for a single restaurant rather than multiple restaurants.
- Real-time delivery tracking is not included.
- Advanced analytics are not included.
- The frontend uses plain JavaScript rather than a framework such as React.

---

## Future Improvements

- Stripe or PayPal payment integration
- Email or SMS delivery for reset PINs
- Real-time order updates using WebSockets
- More advanced recommendation using order history and customer preferences
- Staff role management
- Kitchen display system
- Inventory/stock management
- Detailed restaurant analytics
- Accessibility testing
- Automated API and end-to-end tests
- Mobile app version

---

## Suggested Viva/Demo Flow

1. Open the home page and explain the project purpose.
2. Register a customer account.
3. Log in as a customer.
4. Browse and search menu items.
5. Search recommendations such as `Italian food` or `spicy chicken`.
6. Add an item to cart.
7. Demonstrate cash checkout.
8. Demonstrate online card checkout.
9. Create, edit, and delete a table booking.
10. Submit a review.
11. Log in as admin.
12. Show admin dashboard.
13. Add, edit, and delete a menu item.
14. Manage orders.
15. Manage bookings.
16. Approve/unapprove reviews.
17. Add, edit, and delete events/offers.
18. Show backend structure: routes, controllers, models, middleware, and database connection.

---

## Author

**Spandan Neupane**  
BSc Computer Science Final Year Project  
De Montfort University

---

## Repository

```text
https://github.com/Max23143/restaurant-ordering-system
```
