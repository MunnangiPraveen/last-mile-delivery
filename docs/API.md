# API Documentation

This document logs the important REST API endpoints implemented in the Last-Mile Delivery Tracker.

---

## 1. Authentication APIs

### Register Customer Account
- **Method:** `POST`
- **Endpoint:** `/api/auth/register`
- **Purpose:** Creates a new customer account and logs them in. Role is forced to `CUSTOMER` on the server.
- **Request Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword"
  }
  ```
- **Response (200 Success):**
  ```json
  {
    "success": true,
    "data": {
      "userId": "cuid...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "CUSTOMER",
      "redirect": "/customer"
    }
  }
  ```

### User Login
- **Method:** `POST`
- **Endpoint:** `/api/auth/login`
- **Purpose:** Authenticates the user and sets the encrypted cookie session.
- **Request Body:**
  ```json
  {
    "email": "customer@demo.com",
    "password": "Customer@123"
  }
  ```
- **Response (200 Success):**
  ```json
  {
    "success": true,
    "data": {
      "userId": "cuid...",
      "name": "Demo Customer",
      "email": "customer@demo.com",
      "role": "CUSTOMER",
      "redirect": "/customer"
    }
  }
  ```

### User Logout
- **Method:** `POST`
- **Endpoint:** `/api/auth/logout`
- **Purpose:** Destroys the active session cookie.
- **Response (200 Success):**
  ```json
  {
    "success": true,
    "message": "Logged out successfully."
  }
  ```

---

## 2. Order & Shipment APIs

### List Orders
- **Method:** `GET`
- **Endpoint:** `/api/orders`
- **Purpose:** Returns list of orders. Automatically filtered by role:
  - Customers see only their own orders.
  - Agents see only active/completed assigned orders.
  - Admins see all orders.
- **Query Parameters (Filters):** `status`, `zone`, `agentId`, `orderType`, `paymentType`, `search` (tracking number search).
- **Response (200 Success):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "cuid...",
        "trackingNumber": "LMD-170...",
        "pickupAddress": "123 Street",
        "pickupPincode": "500001",
        "dropAddress": "456 Avenue",
        "dropPincode": "110001",
        "status": "CREATED",
        "totalCharge": 550,
        "createdAt": "2024-08-24T..."
      }
    ]
  }
  ```

### Calculate Rate Preview
- **Method:** `POST`
- **Endpoint:** `/api/orders/calculate`
- **Purpose:** Calculates delivery charge preview before order creation.
- **Request Body:**
  ```json
  {
    "pickupPincode": "500001",
    "dropPincode": "110001",
    "length": 50,
    "breadth": 40,
    "height": 30,
    "actualWeight": 8,
    "orderType": "B2C",
    "paymentType": "COD"
  }
  ```
- **Response (200 Success):**
  ```json
  {
    "success": true,
    "data": {
      "pickupZoneName": "South",
      "dropZoneName": "North",
      "actualWeight": 8,
      "volumetricWeight": 12,
      "billableWeight": 12,
      "rateType": "B2C_INTER_ZONE",
      "ratePerKg": 60,
      "baseCharge": 720,
      "codSurcharge": 50,
      "totalCharge": 770
    }
  }
  ```

### Create Order
- **Method:** `POST`
- **Endpoint:** `/api/orders`
- **Purpose:** Books a new delivery shipment. Admins can book on behalf of any customer by passing `customerId`.
- **Request Body:**
  ```json
  {
    "pickupAddress": "Hyderabad, Telangana",
    "pickupPincode": "500001",
    "dropAddress": "Delhi, NCR",
    "dropPincode": "110001",
    "length": 50,
    "breadth": 40,
    "height": 30,
    "actualWeight": 8,
    "orderType": "B2C",
    "paymentType": "COD",
    "customerId": "optional-for-admin"
  }
  ```

### Order Details
- **Method:** `GET`
- **Endpoint:** `/api/orders/[id]`
- **Purpose:** Returns comprehensive details for a shipment including pricing breakdown, assignment, reschedules, and tracking timeline.

---

## 3. Order Management APIs

### Update Order Status
- **Method:** `POST`
- **Endpoint:** `/api/orders/[id]/status`
- **Purpose:** Updates order status. Validates transition lifecycle. Decrements workload if status resolves to DELIVERED/FAILED.
- **Request Body:**
  ```json
  {
    "status": "PICKED_UP",
    "note": "Package successfully picked up from customer door."
  }
  ```

### Reschedule failed order
- **Method:** `POST`
- **Endpoint:** `/api/orders/[id]/reschedule`
- **Purpose:** Allows customers to reschedule a failed delivery. Resets status to `CREATED` and deactivates current agent assignment.
- **Request Body:**
  ```json
  {
    "newDate": "2024-08-26",
    "reason": "Customer wasn't home. Deliver after 5 PM."
  }
  ```

### Manual Agent Assignment
- **Method:** `POST`
- **Endpoint:** `/api/orders/[id]/assign`
- **Required Role:** `ADMIN`
- **Request Body:**
  ```json
  {
    "agentId": "cuid-agent-user-id"
  }
  ```

### Auto Agent Assignment
- **Method:** `POST`
- **Endpoint:** `/api/orders/[id]/auto-assign`
- **Required Role:** `ADMIN`
- **Purpose:** Triggers deterministic workload and zone matching to assign an available agent automatically.

---

## 4. Admin Settings APIs

- **`/api/admin/zones` (GET, POST):** List all zones and configure new delivery zones.
- **`/api/admin/areas` (GET, POST):** List area-to-zone mappings and map new pincodes.
- **`/api/admin/rate-cards` (GET, POST):** View base rates and configure per kg / minimum surcharges.
- **`/api/admin/cod-charges` (GET, POST):** Configure COD fees for B2B/B2C order types.
- **`/api/admin/customers` (GET):** List customers and order metrics.
- **`/api/admin/agents` (GET):** List delivery agents, workload, availability status, and phones.

---

## 5. Agent Settings APIs

- **`/api/agent/availability` (POST):** Delivery agents toggle their availability.
  - **Request Body:** `{"availability": "AVAILABLE" | "BUSY" | "OFFLINE"}`

---

## 6. Notifications APIs

- **`/api/notifications` (GET, POST):** Fetch user notifications and mark them as read.
