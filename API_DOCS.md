# Sip of Eden API Documentation

This document provides details on all available API endpoints for the Sip of Eden application.

## Base URL

When running locally: `http://localhost:5000/api`
When deployed: `https://your-deployment-url.vercel.app/api`

## Authentication

All admin endpoints require authentication via session cookies. Login first at `/admin/login` to get a session.

---

## Products API

### Get All Juices
`GET /juices`

Returns a list of all available juice products.

**Query Parameters:**
- `verifyInventory` (optional): Set to 'true' to verify inventory counts

**Response:**
```json
[
  {
    "id": 1,
    "name": "Liquid Sunset",
    "description": "A refreshing blend of tropical fruits",
    "price": 3500,
    "imageUrl": "...",
    "category": "energy",
    "stock": 25,
    "featured": true,
    "sku": "LS-001"
  },
  // ...more items
]
```

### Get Featured Juices
`GET /juices/featured`

Returns a list of featured juice products.

**Response:** Same as `/juices` but only includes featured items.

### Get Juice by ID
`GET /juices/:id`

Returns details for a specific juice product.

**URL Parameters:**
- `id`: The numeric ID of the juice

**Response:**
```json
{
  "id": 1,
  "name": "Liquid Sunset",
  "description": "A refreshing blend of tropical fruits",
  "price": 3500,
  "imageUrl": "...",
  "category": "energy",
  "stock": 25,
  "featured": true,
  "sku": "LS-001"
}
```

---

## Cart API

### Get Cart Items
`GET /cart/:sessionId`

Returns all items in a specific cart.

**URL Parameters:**
- `sessionId`: The session identifier for the cart

**Response:**
```json
[
  {
    "id": 1,
    "juiceId": 2,
    "sessionId": "session_xyz",
    "quantity": 3,
    "juice": {
      "id": 2,
      "name": "Green Guardian",
      "price": 3200,
      // ...other juice properties
    }
  },
  // ...more items
]
```

### Add to Cart
`POST /cart`

Adds an item to the cart.

**Request Body:**
```json
{
  "juiceId": 1,
  "sessionId": "session_xyz",
  "quantity": 2
}
```

**Response:**
```json
{
  "id": 3,
  "juiceId": 1,
  "sessionId": "session_xyz",
  "quantity": 2
}
```

### Update Cart Item
`PUT /cart/:id`

Updates the quantity of an item in the cart.

**URL Parameters:**
- `id`: The cart item ID

**Request Body:**
```json
{
  "quantity": 5
}
```

**Response:**
```json
{
  "id": 3,
  "juiceId": 1,
  "sessionId": "session_xyz",
  "quantity": 5
}
```

### Remove from Cart
`DELETE /cart/:id`

Removes an item from the cart.

**URL Parameters:**
- `id`: The cart item ID

**Response:**
```json
{
  "message": "Item removed from cart"
}
```

### Clear Cart
`DELETE /cart/clear/:sessionId`

Clears all items from a specific cart.

**URL Parameters:**
- `sessionId`: The session identifier for the cart

**Response:**
```json
{
  "message": "Cart cleared successfully"
}
```

---

## Order API

### Create Order
`POST /orders`

Creates a new order.

**Request Body:**
```json
{
  "customerName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "address": "123 Main St, City",
  "items": [
    {
      "juiceId": 1,
      "quantity": 2,
      "price": 3500
    },
    {
      "juiceId": 3,
      "quantity": 1,
      "price": 3500
    }
  ],
  "total": 10500,
  "paymentMethod": "online",
  "paymentStatus": "pending"
}
```

**Response:**
```json
{
  "id": 1,
  "customerName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "address": "123 Main St, City",
  "total": 10500,
  "status": "pending",
  "paymentMethod": "online",
  "paymentStatus": "pending",
  "createdAt": "2023-06-15T12:30:45Z"
}
```

### Get Order by ID
`GET /orders/:id`

Returns details for a specific order.

**URL Parameters:**
- `id`: The order ID

**Response:**
```json
{
  "id": 1,
  "customerName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "address": "123 Main St, City",
  "total": 10500,
  "status": "pending",
  "paymentMethod": "online",
  "paymentStatus": "pending",
  "createdAt": "2023-06-15T12:30:45Z",
  "items": [
    {
      "id": 1,
      "orderId": 1,
      "juiceId": 1,
      "quantity": 2,
      "price": 3500,
      "juice": {
        "id": 1,
        "name": "Liquid Sunset",
        // ...other juice properties
      }
    },
    // ...more items
  ]
}
```

---

## Admin API

### Admin Login
`POST /admin/login`

Authenticates an admin user.

**Request Body:**
```json
{
  "username": "admin",
  "password": "yourpassword"
}
```

**Response:**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@sipofeden.com",
  "role": "admin",
  "lastLogin": "2023-06-15T12:30:45Z"
}
```

### Get Admin Profile
`GET /admin/profile`

Returns the profile information for the authenticated admin.

**Response:**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@sipofeden.com",
  "role": "admin",
  "lastLogin": "2023-06-15T12:30:45Z"
}
```

### Update Admin Profile
`PUT /admin/profile`

Updates the admin profile.

**Request Body:**
```json
{
  "email": "newemail@sipofeden.com",
  "displayName": "Admin User"
}
```

**Response:**
```json
{
  "id": 1,
  "username": "admin",
  "email": "newemail@sipofeden.com",
  "displayName": "Admin User",
  "role": "admin",
  "lastLogin": "2023-06-15T12:30:45Z"
}
```

### Update Admin Password
`PUT /admin/password`

Updates the admin password.

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

**Response:**
```json
{
  "message": "Password updated successfully"
}
```

### Admin Product Management

#### Create Juice Product
`POST /admin/juices`

Creates a new juice product.

**Request Body:**
```json
{
  "name": "New Juice",
  "description": "A delicious new flavor",
  "price": 3200,
  "imageUrl": "...base64 image data...",
  "category": "detox",
  "stock": 30,
  "featured": false,
  "sku": "NJ-001"
}
```

**Response:** The created juice object

#### Update Juice Product
`PUT /admin/juices/:id`

Updates an existing juice product.

**URL Parameters:**
- `id`: The juice product ID

**Request Body:** Any fields to update (partial updates supported)

**Response:** The updated juice object

#### Delete Juice Product
`DELETE /admin/juices/:id`

Deletes a juice product.

**URL Parameters:**
- `id`: The juice product ID

**Response:**
```json
{
  "message": "Juice deleted successfully"
}
```

### Admin Order Management

#### Get All Orders
`GET /admin/orders`

Returns a list of all orders.

**Query Parameters:**
- `status` (optional): Filter by order status
- `limit` (optional): Number of orders to return
- `offset` (optional): Starting index for pagination

**Response:**
```json
[
  {
    "id": 1,
    "customerName": "John Doe",
    "email": "john@example.com",
    "total": 10500,
    "status": "pending",
    "createdAt": "2023-06-15T12:30:45Z"
  },
  // ...more orders
]
```

#### Update Order Status
`PUT /admin/orders/:id/status`

Updates the status of an order.

**URL Parameters:**
- `id`: The order ID

**Request Body:**
```json
{
  "status": "processing"
}
```

**Response:** The updated order object

---

## Website Settings API

### Get Website Settings
`GET /settings`

Returns the current website settings.

**Response:**
```json
{
  "name": "Sip of Eden",
  "businessEmail": "contact@sipofeden.com",
  "phoneNumber": "+234 000 0000 000",
  "address": "Lagos, Nigeria",
  "instagram": "https://instagram.com/sipofeden",
  "twitter": "https://twitter.com/sipofeden",
  "facebook": "https://facebook.com/sipofeden"
}
```

### Update Website Settings (Admin Only)
`PUT /admin/settings`

Updates the website settings.

**Request Body:** Any fields to update (partial updates supported)

**Response:** The updated settings object

---

## Error Responses

All API endpoints return appropriate HTTP status codes:

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error

Error responses include a message explaining the error:

```json
{
  "message": "Descriptive error message",
  "code": "ERROR_CODE" // Optional error code
}
```

---

## Rate Limiting

API requests are rate-limited to prevent abuse. The limits are:
- 100 requests per minute for public endpoints
- 300 requests per minute for authenticated admin endpoints

---

## Versioning

This documentation describes API v1. Future versions will be available at `/api/v2/`, etc.

---

For any questions or issues with the API, please contact support@sipofeden.com. 