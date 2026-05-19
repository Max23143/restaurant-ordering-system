# Viva and Demonstration Checklist

This checklist is designed to help demonstrate the Restaurant Ordering and Management System clearly during the final viva.

## Before Starting the Demo

- Start the backend server using `npm run dev`.
- Confirm MongoDB is connected.
- Open the frontend using VS Code Live Server.
- Keep Postman open with the API collection if backend evidence is requested.
- Prepare one customer account and one admin account.

## Suggested Demo Flow

1. Open the home page and explain the project aim.
2. Show the public menu and explain search/filtering.
3. Search for a food term such as `Italian food` or `spicy chicken`.
4. Register or log in as a customer.
5. Add a menu item to the cart.
6. Demonstrate cash checkout.
7. Demonstrate online/card checkout and the separate payment page.
8. Show order history.
9. Create a table booking.
10. Edit the booking.
11. Delete the booking.
12. Submit a review.
13. View public events and offers.
14. Log out and log in as admin.
15. Show the admin dashboard.
16. Add, edit, and delete a menu item.
17. Update an order status.
18. Update a booking status.
19. Approve or unapprove a review.
20. Add, edit, and delete an event or offer.
21. Explain the backend structure: routes, controllers, models, middleware, and MongoDB connection.
22. Explain how authentication and role-based access work.
23. Explain why payment is simulated and why full card details are not stored.
24. Explain the rule-based recommendation/search suggestion logic.
25. Finish with limitations and future improvements.

## Important Points to Mention

- The system is a single-restaurant academic prototype.
- The online payment feature is simulated for safe demonstration.
- The recommendation feature is rule-based and explainable, not a trained machine learning model.
- The backend calculates order totals from database prices rather than trusting frontend values.
- JWT is used to protect customer and admin routes.
- Admin-only middleware prevents normal customers from accessing admin functions.
