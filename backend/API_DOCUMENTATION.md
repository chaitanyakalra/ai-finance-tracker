# FinanceGuard AI — Backend API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Base URL & Versioning](#base-url--versioning)
3. [Authentication Flow](#authentication-flow)
4. [Role-Based Access Control](#role-based-access-control)
5. [Role Assignment Strategy](#role-assignment-strategy)
6. [Standard Error Format](#standard-error-format)
7. [Error Codes Reference](#error-codes-reference)
8. [Endpoints](#endpoints)
   - [Auth](#auth-endpoints)
   - [Expenses](#expense-endpoints)
   - [Dashboard](#dashboard-endpoints)
   - [Users](#user-endpoints)
9. [Filtering & Pagination](#filtering--pagination)
10. [Postman Collection](#postman-collection)

---

## Overview

FinanceGuard AI is a finance tracking backend built with **Node.js**, **Express**, and **MongoDB (Mongoose)**. It exposes a RESTful JSON API secured with **JWT Bearer tokens** and enforces role-based access control across all routes.

---

## Base URL & Versioning

```
http://localhost:8000/api
```

All endpoints are prefixed with `/api`. There is no explicit version segment; the current API is considered v1.

---

## Authentication Flow

### 1. Obtain Tokens

**Google OAuth (recommended)**

```
GET /api/auth/google
```

Redirects to Google's OAuth consent screen. On success, redirects back to the frontend with:

```json
{
  "accessToken": "<JWT access token>",
  "refreshToken": "<opaque refresh token>",
  "user": { "id": "...", "email": "...", "name": "...", "role": "viewer" }
}
```

### 2. Include Access Token in Requests

Add the access token to the `Authorization` header of every protected request:

```
Authorization: Bearer <accessToken>
```

### 3. Refresh Access Token

Access tokens expire after a short window. Use the refresh token to obtain a new one:

```http
POST /api/auth/refresh
Content-Type: application/json

{ "refreshToken": "<refreshToken>" }
```

**Response:**

```json
{ "accessToken": "<new JWT access token>" }
```

### 4. Logout

```http
POST /api/auth/logout
Authorization: Bearer <accessToken>

{ "refreshToken": "<refreshToken>" }
```

Invalidates the refresh token server-side. The access token expires naturally.

---

## Role-Based Access Control

The system defines **three roles** with cumulative permissions:

| Permission           | Viewer | Analyst | Admin |
|----------------------|--------|---------|-------|
| View records         | ✅     | ✅      | ✅    |
| View analytics       | ✅     | ✅      | ✅    |
| View dashboard       | ✅     | ✅      | ✅    |
| Create records       | ❌     | ✅      | ✅    |
| Update records       | ❌     | ✅      | ✅    |
| Delete records       | ❌     | ❌      | ✅    |
| Manage users         | ❌     | ❌      | ✅    |
| Manage groups        | ❌     | ✅      | ✅    |

### Role Enforcement

- **Route-level:** Middleware (`authorizeRoles`, `requireMinimumRole`, `adminOnly`) rejects requests with HTTP 403 before the controller is reached.
- **Controller-level:** Some controllers enforce additional ownership checks (e.g. a user can only update their own profile unless they are an admin).

---

## Role Assignment Strategy

### 1. Automatic — On Signup (Default)

Every new user is automatically assigned the **`viewer`** role when they register or sign in for the first time via Google OAuth. This is enforced in `backend/services/auth.service.js`:

```javascript
role: existingUser?.role ?? 'viewer'
```

Viewers can read dashboard data but cannot create or modify records.

### 2. Manual — Admin Action

An admin can change any user's role at any time:

```http
PUT /api/users/:userId/role
Authorization: Bearer <adminAccessToken>
Content-Type: application/json

{ "role": "analyst" }
```

Valid roles: `viewer`, `analyst`, `admin`.

### 3. Request-Based (Optional Feature)

A user may request a role upgrade through an in-app workflow (not yet implemented in this version). The recommended approach:

1. User submits a role-change request (e.g. via `POST /api/users/me/role-request`).
2. Admin receives a notification (email or in-app).
3. Admin approves or rejects via `PUT /api/users/:userId/role`.
4. User is notified of the outcome.

### 4. Hybrid — Organization Code / Domain

For multi-tenant setups, automatic role assignment can be based on:
- **Email domain:** users with `@yourcompany.com` receive `analyst` on signup.
- **Invitation code:** users who sign up with a valid invitation code receive the role attached to the invitation.

This can be implemented by extending `auth.service.js` to check the email domain or a passed invitation token during the OAuth callback.

### Role Change Notifications

When a role is updated via `PUT /api/users/:userId/role`, the system should (optionally) send an email to the affected user using the existing `email.service.js`. The email controller layer can be added by calling `EmailService.sendRoleChangeNotification(user, newRole)` after a successful role update.

---

## Standard Error Format

All error responses follow this consistent shape:

```json
{
  "error": "Error Type",
  "message": "Human-readable description of what went wrong.",
  "statusCode": 400,
  "details": [
    { "field": "amount", "message": "amount must be a positive number" }
  ]
}
```

- `error` — Short error category (e.g. `"Validation Error"`, `"Unauthorized"`, `"Forbidden"`).
- `message` — Human-readable explanation suitable for display.
- `statusCode` — Mirrors the HTTP status code.
- `details` — Optional array. Present for validation errors; contains per-field messages.

---

## Error Codes Reference

| HTTP Status | Error Type             | When it occurs                                        |
|-------------|------------------------|-------------------------------------------------------|
| 400         | Validation Error       | Request body fails Joi or Mongoose schema validation  |
| 400         | Bad Request            | Invalid query parameter or malformed data             |
| 401         | Unauthorized           | Missing, invalid, or expired JWT                      |
| 403         | Forbidden              | Authenticated but insufficient role/permission        |
| 404         | Not Found              | Resource does not exist or access denied to requester |
| 409         | Conflict               | Duplicate key violation (e.g., duplicate email)       |
| 503         | Service Unavailable    | MongoDB connection is down                            |
| 500         | Internal Server Error  | Unhandled server-side error                           |

---

## Endpoints

### Auth Endpoints

#### `GET /api/auth/google`

Initiates Google OAuth flow. Redirects to Google consent screen.

---

#### `GET /api/auth/google/callback`

OAuth callback. Returns tokens and user info.

**Response 200:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "rt_abc123...",
  "user": {
    "id": "uuid-v4",
    "email": "user@example.com",
    "name": "Alice",
    "role": "viewer"
  }
}
```

---

#### `POST /api/auth/refresh`

Refresh an expired access token.

**Request body:**
```json
{ "refreshToken": "rt_abc123..." }
```

**Response 200:**
```json
{ "accessToken": "eyJhbGc..." }
```

---

#### `POST /api/auth/logout`

Invalidate refresh token.

**Request body:**
```json
{ "refreshToken": "rt_abc123..." }
```

**Response 200:**
```json
{ "message": "Logged out." }
```

---

### Expense Endpoints

All expense endpoints require `Authorization: Bearer <token>`.

#### `POST /api/expenses`

Create a new expense or income record. **Roles:** analyst, admin.

**Request body:**
```json
{
  "type": "expense",
  "category": "Food",
  "amount": 45.50,
  "date": "2025-03-15",
  "description": "Lunch with team",
  "tags": ["work", "lunch"],
  "isRecurring": false,
  "notes": "Expensed"
}
```

**Validation rules:**
- `type` — required; `"income"` or `"expense"`
- `category` — required; one of `Food`, `Transport`, `Shopping`, `Bills`, `Entertainment`, `Salary`, `Bonus`, `Investment`, `Healthcare`, `Education`, `Others`
- `amount` — required; positive number, max 2 decimal places
- `date` — required; ISO 8601 date, cannot be in the future
- `description` — optional; max 500 characters
- `tags` — optional; array of strings, max 10 items
- `isRecurring` — optional boolean (default `false`)
- `recurringFrequency` — required if `isRecurring` is `true`; one of `daily`, `weekly`, `monthly`, `yearly`
- `recurringEndDate` — optional; must be after `date`
- `notes` — optional; max 1000 characters

**Response 201:**
```json
{
  "id": "uuid-v4",
  "userId": "user-uuid",
  "type": "expense",
  "category": "Food",
  "amount": 45.50,
  "date": "2025-03-15T00:00:00.000Z",
  "description": "Lunch with team",
  "tags": ["work", "lunch"],
  "isRecurring": false,
  "created_at": "2025-03-15T12:00:00.000Z"
}
```

---

#### `GET /api/expenses`

List expenses with optional filtering, sorting, and pagination. **Roles:** viewer, analyst, admin.

**Query parameters:**

| Parameter   | Type    | Description                                    | Example                  |
|-------------|---------|------------------------------------------------|--------------------------|
| `startDate` | string  | Filter records on or after this date           | `2025-01-01`             |
| `endDate`   | string  | Filter records on or before this date          | `2025-12-31`             |
| `category`  | string  | Filter by category name                        | `Food`                   |
| `type`      | string  | `income` or `expense`                          | `expense`                |
| `minAmount` | number  | Minimum amount (inclusive)                     | `100`                    |
| `maxAmount` | number  | Maximum amount (inclusive)                     | `500`                    |
| `tags`      | string  | Filter by tag (can repeat for multiple)        | `tags=work&tags=lunch`   |
| `sortBy`    | string  | Sort field: `date`, `amount`, `category`       | `amount`                 |
| `sortOrder` | string  | `asc` or `desc` (default `desc`)               | `asc`                    |
| `page`      | number  | Page number (default 1)                        | `2`                      |
| `limit`     | number  | Records per page (default 20)                  | `10`                     |

**Response 200:**
```json
{
  "data": [ { "id": "...", "amount": 45.50, "category": "Food", ... } ],
  "pagination": { "total": 100, "page": 1, "limit": 20, "pages": 5 },
  "activeFilters": { "category": "Food", "startDate": "2025-01-01" }
}
```

---

#### `GET /api/expenses/recent`

Returns the 10 most recent expense records. **Roles:** viewer, analyst, admin.

**Query parameters:** `limit` (optional, default 10)

---

#### `GET /api/expenses/stats`

Returns totals: total income, total expenses, and net balance. **Roles:** viewer, analyst, admin.

**Response 200:**
```json
{
  "totalIncome": 5000.00,
  "totalExpenses": 2300.50,
  "netBalance": 2699.50,
  "incomeCount": 3,
  "expenseCount": 12
}
```

---

#### `GET /api/expenses/monthly`

Returns monthly breakdown for the last N months. **Roles:** viewer, analyst, admin.

**Query parameters:** `months` (default 12)

**Response 200:**
```json
{
  "2025-03": { "income": 5000, "expenses": 1200, "net": 3800, "count": 8 },
  "2025-02": { "income": 5000, "expenses": 1400, "net": 3600, "count": 10 }
}
```

---

#### `GET /api/expenses/category/:category`

Returns all expenses for a specific category. **Roles:** viewer, analyst, admin.

**Path parameters:** `category` — must match a valid category name (case-sensitive).

**Query parameters:** `startDate`, `endDate`, `page`, `limit`

---

#### `PUT /api/expenses/:id`

Update an expense record. Analysts can only update their own records; admins can update any. **Roles:** analyst, admin.

**Request body:** Any subset of the fields from `POST /api/expenses`. At least one field required.

**Response 200:** Updated expense object.

---

#### `DELETE /api/expenses/:id`

Delete an expense record. **Roles:** admin only.

**Response 200:**
```json
{ "message": "Expense deleted.", "id": "uuid-v4" }
```

---

### Dashboard Endpoints

All dashboard endpoints require `Authorization: Bearer <token>`. **Minimum role:** viewer.

#### `GET /api/dashboard`

Returns a complete summary for the dashboard in a single call.

**Query parameters:** `startDate`, `endDate` (default: start of current year → today)

**Response 200:**
```json
{
  "summary": {
    "totalIncome": 15000.00,
    "totalExpenses": 8400.75,
    "netBalance": 6599.25,
    "dateRange": { "startDate": "2025-01-01T00:00:00.000Z", "endDate": "2025-03-15T..." }
  },
  "categoryBreakdown": [
    { "category": "Food", "total": 1200.00, "count": 24, "percentage": 14.28 }
  ],
  "monthlyTrends": [
    { "month": "2025-01", "income": 5000, "expenses": 2800, "netBalance": 2200, "txCount": 18 }
  ],
  "recentActivity": [ { "id": "...", "amount": 45, "category": "Food", "date": "..." } ]
}
```

---

#### `GET /api/dashboard/categories`

Category-wise expense breakdown. **Minimum role:** viewer.

**Query parameters:** `startDate`, `endDate`

**Response 200:**
```json
{
  "categories": [
    { "category": "Food", "total": 1200.00, "count": 24, "percentage": 14.28 },
    { "category": "Transport", "total": 800.00, "count": 10, "percentage": 9.52 }
  ]
}
```

---

#### `GET /api/dashboard/trends`

Monthly income / expense / net balance trends. **Minimum role:** viewer.

**Query parameters:** `months` (default 12, max 60)

**Response 200:**
```json
{
  "trends": [
    { "month": "2025-03", "income": 5000, "expenses": 2800, "netBalance": 2200, "txCount": 18 },
    { "month": "2025-02", "income": 5000, "expenses": 3100, "netBalance": 1900, "txCount": 22 }
  ]
}
```

---

#### `GET /api/dashboard/top-categories`

Top N spending categories. **Minimum role:** viewer.

**Query parameters:** `limit` (default 5, max 20), `startDate`, `endDate`

**Response 200:**
```json
{
  "topCategories": [
    { "category": "Food", "total": 1200.00, "count": 24, "percentage": 30.00 },
    { "category": "Transport", "total": 800.00, "count": 10, "percentage": 20.00 }
  ]
}
```

---

#### `GET /api/dashboard/insights`

Daily spending insights. **Minimum role:** viewer.

**Query parameters:** `startDate`, `endDate`

**Response 200:**
```json
{
  "insights": {
    "avgDaily": 95.50,
    "maxDaily": 350.00,
    "minDaily": 12.00
  }
}
```

---

#### `GET /api/dashboard/budget-vs-actual`

Compares actual spending against a provided monthly budget. **Minimum role:** viewer.

**Query parameters:**

| Parameter          | Type   | Description                          | Example              |
|--------------------|--------|--------------------------------------|----------------------|
| `year`             | number | Year to analyse (default: current)   | `2025`               |
| `month`            | number | Month to analyse (default: current)  | `3`                  |
| `budget_<Category>`| number | Budget amount for that category      | `budget_Food=500`    |

**Example request:**
```
GET /api/dashboard/budget-vs-actual?year=2025&month=3&budget_Food=500&budget_Transport=200
```

**Response 200:**
```json
{
  "year": 2025,
  "month": 3,
  "budgetComparison": [
    { "category": "Food", "actual": 620.00, "budget": 500, "variance": 120.00 },
    { "category": "Transport", "actual": 180.00, "budget": 200, "variance": -20.00 },
    { "category": "Entertainment", "actual": 95.00, "budget": null, "variance": null }
  ]
}
```

A positive `variance` means over-budget; negative means under-budget. `null` means no budget was provided for that category.

---

### User Endpoints

All user endpoints require `Authorization: Bearer <token>`.

#### `GET /api/users/me`

Returns the authenticated user's profile and permissions. **Roles:** any.

**Response 200:**
```json
{
  "user": {
    "id": "uuid-v4",
    "email": "alice@example.com",
    "name": "Alice",
    "role": "analyst",
    "status": "active",
    "lastLogin": "2025-03-15T10:00:00.000Z"
  },
  "permissions": {
    "canViewRecords": true,
    "canCreateRecords": true,
    "canUpdateRecords": true,
    "canDeleteRecords": false,
    "canViewAnalytics": true,
    "canViewDashboard": true,
    "canManageUsers": false,
    "canManageGroups": true
  }
}
```

---

#### `GET /api/users`

List all users. **Roles:** admin only.

**Query parameters:** `role`, `status`, `page` (default 1), `limit` (default 20)

**Response 200:**
```json
{
  "users": [ { "id": "...", "email": "...", "role": "viewer", "status": "active" } ],
  "pagination": { "total": 50, "page": 1, "limit": 20, "pages": 3 }
}
```

---

#### `GET /api/users/:userId`

Get a specific user's profile. Admins can view anyone; other users can only view themselves.

**Response 200:** Same shape as `GET /api/users/me`.

---

#### `PUT /api/users/:userId/role`

Change a user's role. **Roles:** admin only.

**Request body:**
```json
{ "role": "analyst" }
```

**Validation:** `role` must be one of `viewer`, `analyst`, `admin`.

**Response 200:**
```json
{ "message": "Role updated.", "user": { "id": "...", "role": "analyst" } }
```

---

#### `PUT /api/users/:userId/status`

Activate or deactivate a user. **Roles:** admin only.

**Request body:**
```json
{ "status": "inactive" }
```

**Validation:** `status` must be `active` or `inactive`.

**Response 200:**
```json
{ "message": "Status updated.", "user": { "id": "...", "status": "inactive" } }
```

---

#### `PUT /api/users/:userId/profile`

Update a user's name or profile picture. Admins can update anyone; other users can only update themselves.

**Request body:**
```json
{ "name": "Alice Smith", "profilePic": "https://example.com/avatar.png" }
```

**Validation:** At least one of `name` or `profilePic` is required. `profilePic` must be a valid URL.

**Response 200:**
```json
{ "message": "Profile updated.", "user": { "id": "...", "name": "Alice Smith" } }
```

---

## Filtering & Pagination

### Date Range Filtering

Supply ISO 8601 date strings:

```
GET /api/expenses?startDate=2025-01-01&endDate=2025-03-31
```

### Pagination

All list endpoints support `page` and `limit`. The response always includes a `pagination` object:

```json
{
  "pagination": {
    "total": 100,
    "page": 2,
    "limit": 20,
    "pages": 5
  }
}
```

To iterate through all pages:

```
GET /api/expenses?page=1&limit=20
GET /api/expenses?page=2&limit=20
...
GET /api/expenses?page=5&limit=20
```

### Sorting

```
GET /api/expenses?sortBy=amount&sortOrder=asc
```

Sortable fields: `date`, `amount`, `category`, `created_at`.

---

## Postman Collection

Import the following environment variables into Postman:

| Variable       | Value                            |
|----------------|----------------------------------|
| `base_url`     | `http://localhost:8000/api`      |
| `accessToken`  | (set after login)                |
| `refreshToken` | (set after login)                |
| `userId`       | (set after login)                |

### Pre-request Script (set token automatically)

```javascript
// In Postman collection → Pre-request Script
if (pm.environment.get("accessToken")) {
    pm.request.headers.add({
        key: "Authorization",
        value: "Bearer " + pm.environment.get("accessToken")
    });
}
```

### Example Requests

**Create expense:**
```
POST {{base_url}}/expenses
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "type": "expense",
  "category": "Food",
  "amount": 45.50,
  "date": "2025-03-15",
  "description": "Lunch"
}
```

**Dashboard summary:**
```
GET {{base_url}}/dashboard?startDate=2025-01-01&endDate=2025-03-31
Authorization: Bearer {{accessToken}}
```

**Top 3 categories:**
```
GET {{base_url}}/dashboard/top-categories?limit=3
Authorization: Bearer {{accessToken}}
```

**Budget comparison:**
```
GET {{base_url}}/dashboard/budget-vs-actual?year=2025&month=3&budget_Food=500&budget_Transport=200
Authorization: Bearer {{accessToken}}
```
