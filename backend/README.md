# TBB OS — Backend API Documentation

## 📋 Overview

REST API backend for TBB OS built with PHP 8.4+ and MySQL 8+.

**Base URL:** `/api` (or configured domain)

**Authentication:** Session-based with cookies

**Response Format:** JSON

## 🔐 Authentication

All endpoints (except `/login`) require authentication.

### Login
```http
POST /api/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin"
    }
  }
}
```

### Logout
```http
POST /api/logout
```

### Get Current User
```http
GET /api/auth/me
```

### Change Password
```http
PUT /api/auth/password
Content-Type: application/json

{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

## 📊 Dashboard

### Get Dashboard Summary
```http
GET /api/dashboard/summary
```

**Response:**
```json
{
  "success": true,
  "data": {
    "revenue_today": 45000,
    "orders_today": 3,
    "revenue_month": 1250000,
    "orders_month": 45,
    "pending_orders": 5,
    "available_products": 120,
    "inventory_cost_value": 850000,
    "inventory_selling_value": 1500000,
    "total_expenses": 350000,
    "total_revenue": 5750000,
    "gross_profit": 2250000,
    "net_profit": 1900000,
    "total_bales": 12,
    "total_products": 450,
    "total_customers": 89,
    "total_orders": 234,
    "recent_orders": [...],
    "recent_expenses": [...],
    "today": "2026-09-08"
  }
}
```

## 📦 Bales

### List Bales
```http
GET /api/bales?page=1&limit=20&search=supplier&status=Purchased
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 20,
    "total_pages": 1
  }
}
```

### Get Bale Details
```http
GET /api/bales/{id}
```

### Create Bale
```http
POST /api/bales
Content-Type: application/json

{
  "supplierName": "Supplier Name",
  "purchaseDate": "2026-09-08",
  "baleCost": 150000,
  "expectedQty": 50,
  "actualQty": 48,
  "status": "Purchased",
  "notes": "Optional notes"
}
```

### Update Bale
```http
PUT /api/bales/{id}
Content-Type: application/json

{
  "status": "Processing",
  "actualQty": 48
}
```

## 🏷️ Products

### List Products
```http
GET /api/products?page=1&limit=20&search=TBB&status=Available&condition=A&bale_id=1
```

### Get Product Details
```http
GET /api/products/{id}
```

### Search Product by Code
```http
GET /api/products/search/{code}
```

**Example:**
```http
GET /api/products/search/TBB-000001
```

### Create Product
```http
POST /api/products
Content-Type: application/json

{
  "productName": "Product Name",
  "brand": "Brand",
  "category": "Category",
  "size": "M",
  "color": "Red",
  "condition": "A",
  "costPrice": 5000,
  "sellingPrice": 15000,
  "baleId": 1
}
```

### Update Product
```http
PUT /api/products/{id}
Content-Type: application/json

{
  "sellingPrice": 18000,
  "status": "Available"
}
```

## 👥 Customers

### List Customers
```http
GET /api/customers?page=1&limit=20&search=name
```

### Get Customer Details
```http
GET /api/customers/{id}
```

### Search Customers
```http
GET /api/customers/search?q=search_term
```

### Create Customer
```http
POST /api/customers
Content-Type: application/json

{
  "name": "Customer Name",
  "phone": "09123456789",
  "facebookName": "Facebook Name",
  "address": "Full Address",
  "township": "Township",
  "city": "Yangon",
  "notes": "Optional notes"
}
```

### Update Customer
```http
PUT /api/customers/{id}
Content-Type: application/json

{
  "phone": "09987654321",
  "address": "New Address"
}
```

## 🛒 Orders

### List Orders
```http
GET /api/orders?page=1&limit=20&search=voucher&status=Pending&payment_method=COD&date_from=2026-09-01&date_to=2026-09-08
```

### Get Order Details
```http
GET /api/orders/{id}
```

### Create Order
```http
POST /api/orders
Content-Type: application/json

{
  "customerId": 1,
  "productCodes": ["TBB-000001", "TBB-000002"],
  "deliveryFee": 3000,
  "deliveryCompany": "Royal Express",
  "trackingNumber": "TRK123456",
  "paymentMethod": "COD",
  "paymentStatus": "Unpaid",
  "shippingAddress": "Full shipping address"
}
```

**Important:** This endpoint uses database transactions. If any product is unavailable, the entire order is rolled back.

### Update Order
```http
PUT /api/orders/{id}
Content-Type: application/json

{
  "deliveryCompany": "BeeXpress",
  "trackingNumber": "TRK789012",
  "deliveryFee": 3500,
  "paymentStatus": "Paid"
}
```

### Update Order Status
```http
PUT /api/orders/{id}/status
Content-Type: application/json

{
  "status": "Confirmed"
}
```

**Allowed statuses:** Pending, Confirmed, Packed, Shipped, Delivered

### Cancel Order
```http
PUT /api/orders/{id}/cancel
Content-Type: application/json

{
  "reason": "Customer requested cancellation"
}
```

**Note:** Cancelling an order releases all products back to Available status.

## 🧾 Vouchers

### Get Voucher Details
```http
GET /api/vouchers/{id}
```

**Response includes:**
- Order details
- Customer information
- Order items (product codes only)
- Business settings (for receipt header/footer)

## 💰 Finance

### Get Finance Summary
```http
GET /api/finance/summary?date_from=2026-09-01&date_to=2026-09-08
```

**Response:**
```json
{
  "success": true,
  "data": {
    "revenue": 1250000,
    "product_cost": 450000,
    "gross_profit": 800000,
    "total_expenses": 350000,
    "net_profit": 450000
  }
}
```

### List Expenses
```http
GET /api/expenses?page=1&limit=20&category=Bale Purchase&date_from=2026-09-01&date_to=2026-09-08
```

### Create Expense
```http
POST /api/expenses
Content-Type: application/json

{
  "expenseDate": "2026-09-08",
  "category": "Bale Purchase",
  "amount": 150000,
  "description": "Bale from supplier",
  "reference": "BAL-260908-001"
}
```

**Allowed categories:** Bale Purchase, Delivery Cost, Packaging Cost, Miscellaneous

### Update Expense
```http
PUT /api/expenses/{id}
Content-Type: application/json

{
  "amount": 160000,
  "description": "Updated description"
}
```

## 📈 Reports

### Daily Sales
```http
GET /api/reports/daily-sales?date_from=2026-09-01&date_to=2026-09-08
```

### Monthly Sales
```http
GET /api/reports/monthly-sales?date_from=2026-01-01&date_to=2026-09-08
```

### Inventory Report
```http
GET /api/reports/inventory?page=1&limit=50&status=Available
```

### Bale Performance
```http
GET /api/reports/bale-performance
```

### Profit & Loss
```http
GET /api/reports/profit-loss?date_from=2026-09-01&date_to=2026-09-08
```

### Customer History
```http
GET /api/reports/customer-history
```

### Voucher History
```http
GET /api/reports/voucher-history?page=1&limit=20&search=TBB&date_from=2026-09-01&date_to=2026-09-08
```

## ⚙️ Settings

### Get Settings
```http
GET /api/settings
```

**Response:**
```json
{
  "success": true,
  "data": {
    "business_name": "The Bra Boutique (Yangon)",
    "phone": "09-xxxxxxxxx",
    "facebook": "The Bra Boutique (Yangon)",
    "address": "Yangon, Myanmar",
    "voucher_footer": "Thank You For Shopping With Us!",
    "currency": "MMK",
    "currency_symbol": "K",
    "tax_rate": "0"
  }
}
```

### Update Settings
```http
PUT /api/settings
Content-Type: application/json

{
  "business_name": "New Business Name",
  "phone": "09123456789",
  "facebook": "Facebook Page",
  "address": "New Address",
  "voucher_footer": "New footer message"
}
```

### Export Database Backup
```http
GET /api/settings/backup
```

**Response:** JSON file download

## 📝 Activity Logs

### List Activity Logs
```http
GET /api/activity-logs?page=1&limit=50&search=Login&action=Login
```

## 🗄️ Database Backup

### Export All Data
```http
GET /api/settings/backup
```

Downloads a JSON file containing all business data.

## 🚨 Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "details": {} // Optional additional details
}
```

### Common HTTP Status Codes

- `200` — Success
- `400` — Bad Request (validation error)
- `401` — Unauthorized (not logged in)
- `403` — Forbidden (insufficient permissions)
- `404` — Not Found
- `409` — Conflict (e.g., product already sold)
- `422` — Unprocessable Entity (invalid business data)
- `500` — Internal Server Error

## 🔒 Security Notes

1. **Authentication:** All endpoints except `/login` require authentication
2. **Session:** Uses PHP sessions with secure cookies
3. **CSRF:** Protected by session-based authentication
4. **SQL Injection:** All queries use prepared statements
5. **XSS:** All output is properly escaped
6. **Rate Limiting:** Consider implementing for production
7. **HTTPS:** Always use HTTPS in production

## 📊 Pagination

All list endpoints support pagination:

**Query Parameters:**
- `page` — Page number (default: 1)
- `limit` — Items per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "total_pages": 5
  }
}
```

## 🔍 Search & Filtering

Most list endpoints support:

- `search` — Full-text search
- `status` — Filter by status
- `date_from` / `date_to` — Date range
- Additional filters specific to each endpoint

## 💡 Best Practices

1. **Use pagination** for all list endpoints
2. **Cache responses** where appropriate
3. **Handle errors gracefully** in frontend
4. **Validate input** on both client and server
5. **Use HTTPS** in production
6. **Monitor activity logs** for security
7. **Regular backups** of database
8. **Keep PHP updated** to latest 8.4.x version

---

**API Version:** 1.0.0  
**Last Updated:** 2026  
**Backend:** PHP 8.4+ / MySQL 8+
