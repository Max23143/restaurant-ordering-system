# Postman API Testing

This folder is prepared for the exported Postman collection used to test the backend API.

## Base URL

```text
http://127.0.0.1:5000/api
```

## Recommended Collection File

Export the Postman collection and place it here:

```text
docs/postman/restaurant-api-tests.postman_collection.json
```

## Endpoints Tested

The backend API testing should include:

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- invalid login test
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /menu`
- `GET /menu?search=italian`
- `POST /menu`
- `PUT /menu/:id`
- `DELETE /menu/:id`
- `POST /bookings`
- `GET /bookings/my-bookings`
- `PUT /bookings/my-bookings/:id`
- `DELETE /bookings/my-bookings/:id`
- `POST /orders`
- `GET /orders/my-orders`
- `GET /orders/admin/all`
- `PUT /orders/admin/:id/status`
- `POST /reviews`
- `GET /recommendations/search?query=italian food`
- `POST /events-offers/admin`
- `GET /events-offers?type=offer`
- `GET /events-offers?type=event`
- `PUT /events-offers/admin/:id`
- `DELETE /events-offers/admin/:id`

## Evidence Value

The exported Postman collection supports verification because it proves that the backend was tested separately from the frontend. It also helps the project marker or supervisor repeat the tests if required.
