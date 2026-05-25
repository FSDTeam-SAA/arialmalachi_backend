# User Blocking System - Complete Documentation

## Overview

The User Blocking System allows administrators to temporarily or permanently block users from accessing the platform. The system includes:

- ✅ Temporary blocking (minutes, hours, days)
- ✅ Permanent blocking
- ✅ Automatic unblocking based on expiry time
- ✅ Manual unblocking by admins

---

## Table of Contents

1. [Block User Endpoint](#block-user-endpoint)
2. [Unblock User Endpoint](#unblock-user-endpoint)
3. [Request Body Examples](#request-body-examples)
4. [Response Examples](#response-examples)
5. [Blocking Process Flow](#blocking-process-flow)
6. [Database Schema](#database-schema)
7. [Error Handling](#error-handling)
8. [Postman Collection](#postman-collection)

---

## Block User Endpoint

### Basic Information

| Property           | Value                   |
| ------------------ | ----------------------- |
| **Method**         | PATCH                   |
| **Endpoint**       | `/v1/user/:id/block`    |
| **Authentication** | Required (Bearer Token) |
| **Authorization**  | Admin Only              |
| **URL Parameter**  | `id` - User ID to block |

### URL Example

```
PATCH /v1/user/507f1f77bcf86cd799439011/block
```

---

## Request Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

## Request Body

### Schema

```json
{
  "duration": 7,
  "unit": "days",
  "isPermanent": false
}
```

### Parameters

| Field         | Type    | Required    | Valid Values               | Description                                                 |
| ------------- | ------- | ----------- | -------------------------- | ----------------------------------------------------------- |
| `duration`    | number  | Conditional | 1-999                      | Length of block period (required if `isPermanent` is false) |
| `unit`        | string  | Conditional | `minutes`, `hours`, `days` | Time unit (required if `isPermanent` is false)              |
| `isPermanent` | boolean | Yes         | true, false                | Whether block is permanent                                  |

---

## Request Body Examples

### Example 1: Block for 1 Hour

```json
{
  "duration": 1,
  "unit": "hours",
  "isPermanent": false
}
```

**Use Case**: Temporary ban for suspicious activity

---

### Example 2: Block for 7 Days

```json
{
  "duration": 7,
  "unit": "days",
  "isPermanent": false
}
```

**Use Case**: Extended block for policy violation

---

### Example 3: Block for 30 Minutes

```json
{
  "duration": 30,
  "unit": "minutes",
  "isPermanent": false
}
```

**Use Case**: Quick cooldown period

---

### Example 4: Permanent Block

```json
{
  "isPermanent": true
}
```

**Use Case**: Ban for severe violations or account abuse

---

## Response Examples

### Success Response: Block for 7 Days

**Status Code**: 200 OK

```json
{
  "success": true,
  "message": "User blocked successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "isBlocked": true,
    "blockedUntil": "2026-06-01T10:30:00.000Z",
    "isPermanentBlock": false,
    "blockedUsers": [],
    "credits": 50,
    "isSubscribed": true,
    "createdAt": "2026-05-18T08:15:00.000Z",
    "updatedAt": "2026-05-25T10:30:00.000Z"
  }
}
```

---

### Success Response: Permanent Block

**Status Code**: 200 OK

```json
{
  "success": true,
  "message": "User blocked successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "isBlocked": true,
    "blockedUntil": null,
    "isPermanentBlock": true,
    "blockedUsers": [],
    "credits": 50,
    "isSubscribed": true,
    "createdAt": "2026-05-18T08:15:00.000Z",
    "updatedAt": "2026-05-25T10:30:00.000Z"
  }
}
```

---

### Error Response: User Not Found

**Status Code**: 500 Internal Server Error

```json
{
  "success": false,
  "message": "Failed to block user",
  "data": "User not found"
}
```

---

### Error Response: Invalid Unit

**Status Code**: 500 Internal Server Error

```json
{
  "success": false,
  "message": "Failed to block user",
  "data": "Invalid duration unit"
}
```

---

### Error Response: Unauthorized (Not Admin)

**Status Code**: 403 Forbidden

```json
{
  "success": false,
  "message": "Unauthorized access"
}
```

---

## Blocking Process Flow

```
┌─────────────────────────────────────────────────┐
│  Admin sends PATCH /v1/user/:id/block          │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
         ┌──────────────────┐
         │ Check Auth Token │
         └────────┬─────────┘
                  │
                  ├─ Valid? → Continue
                  └─ Invalid? → 403 Forbidden
                  │
                 ▼
         ┌──────────────────────┐
         │ Check Admin Role     │
         └────────┬─────────────┘
                  │
                  ├─ Admin? → Continue
                  └─ Not Admin? → 403 Forbidden
                  │
                 ▼
      ┌─────────────────────────────┐
      │ Find User by ID             │
      └────────┬────────────────────┘
               │
               ├─ Found? → Continue
               └─ Not Found? → 500 Error "User not found"
               │
              ▼
      ┌────────────────────────┐
      │ Check isPermanent Flag │
      └─────┬──────────┬──────┘
            │          │
       YES  │          │  NO
            ▼          ▼
        ┌─────────┐  ┌──────────────────────┐
        │PERMANENT│  │ Calculate Block Date │
        │  BLOCK  │  │  Expiry Time         │
        └────┬────┘  └─────────┬────────────┘
             │                 │
             ▼                 ▼
      ┌─────────────────────────────────────┐
      │ Update User Document:               │
      │ - isBlocked = true                  │
      │ - isPermanentBlock = true/false     │
      │ - blockedUntil = date or null       │
      └────────────┬────────────────────────┘
                   │
                   ▼
          ┌─────────────────┐
          │ Save to Database│
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │ Return Response │
          │ with User Data  │
          └─────────────────┘
```

---

## Database Schema

### User Document - Block Fields

```javascript
{
  // ... other fields ...

  isBlocked: {
    type: Boolean,
    default: false
  },

  blockedUntil: {
    type: Date,
    default: null
  },

  isPermanentBlock: {
    type: Boolean,
    default: false
  },

  blockedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],

  // ... other fields ...
}
```

### Database Update Example

#### Before Block

```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "email": "john@example.com",
  "name": "John Doe",
  "isBlocked": false,
  "blockedUntil": null,
  "isPermanentBlock": false
}
```

#### After Block for 7 Days

```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "email": "john@example.com",
  "name": "John Doe",
  "isBlocked": true,
  "blockedUntil": ISODate("2026-06-01T10:30:00.000Z"),
  "isPermanentBlock": false
}
```

#### After Permanent Block

```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "email": "john@example.com",
  "name": "John Doe",
  "isBlocked": true,
  "blockedUntil": null,
  "isPermanentBlock": true
}
```

---

## Service Layer Logic

### Block User Function

```javascript
export const blockUser = async (userId, { duration, unit, isPermanent }) => {
  // Step 1: Find user
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  // Step 2: Check if permanent block
  if (isPermanent) {
    user.isBlocked = true;
    user.isPermanentBlock = true;
    user.blockedUntil = null;
  }
  // Step 3: Temporary block - calculate expiry
  else {
    const now = new Date();
    let blockedUntil = new Date(now);

    if (unit === 'minutes')
      blockedUntil.setMinutes(now.getMinutes() + duration);
    else if (unit === 'hours') blockedUntil.setHours(now.getHours() + duration);
    else if (unit === 'days') blockedUntil.setDate(now.getDate() + duration);
    else throw new Error('Invalid duration unit');

    user.isBlocked = true;
    user.isPermanentBlock = false;
    user.blockedUntil = blockedUntil;
  }

  // Step 4: Save and return
  return await user.save();
};
```

---

## Unblock User Endpoint

### Basic Information

| Property           | Value                    |
| ------------------ | ------------------------ |
| **Method**         | PATCH                    |
| **Endpoint**       | `/v1/user/:id/unblock`   |
| **Authentication** | Required (Bearer Token)  |
| **Authorization**  | Admin Only               |
| **Body**           | Empty (no body required) |

---

## Unblock Request Example

```bash
PATCH /v1/user/507f1f77bcf86cd799439011/unblock
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

## Unblock Response Example

**Status Code**: 200 OK

```json
{
  "success": true,
  "message": "User unblocked successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "isBlocked": false,
    "blockedUntil": null,
    "isPermanentBlock": false,
    "blockedUsers": [],
    "credits": 50,
    "isSubscribed": true,
    "createdAt": "2026-05-18T08:15:00.000Z",
    "updatedAt": "2026-05-25T11:45:00.000Z"
  }
}
```

---

## Error Handling

### Error Scenarios

| Scenario           | Status Code | Error Message                      |
| ------------------ | ----------- | ---------------------------------- |
| Missing auth token | 401         | Unauthorized                       |
| Not an admin       | 403         | Forbidden                          |
| User not found     | 500         | User not found                     |
| Invalid unit       | 500         | Invalid duration unit              |
| Invalid duration   | 400         | Duration must be a positive number |
| Database error     | 500         | Internal server error              |

---

## Auto-Unblock Process

The system automatically unblocks users when:

1. Current time exceeds `blockedUntil` date
2. `isPermanentBlock` is `false`
3. Automatic check runs on schedule

```javascript
export const checkAutoUnblock = async () => {
  const now = new Date();

  // Find all temporarily blocked users whose block has expired
  const blockedUsers = await User.find({
    isBlocked: true,
    isPermanentBlock: false,
    blockedUntil: { $lt: now }
  });

  for (const user of blockedUsers) {
    user.isBlocked = false;
    user.blockedUntil = null;
    await user.save();
    console.log(`Auto-unblocked user: ${user.email}`);
  }
};
```

---

## Postman Collection

### Block User - cURL Example

```bash
curl --location --request PATCH 'http://localhost:5000/api/v1/user/507f1f77bcf86cd799439011/block' \
  --header 'Authorization: Bearer {{token}}' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "duration": 7,
    "unit": "days",
    "isPermanent": false
  }'
```

### Unblock User - cURL Example

```bash
curl --location --request PATCH 'http://localhost:5000/api/v1/user/507f1f77bcf86cd799439011/unblock' \
  --header 'Authorization: Bearer {{token}}' \
  --header 'Content-Type: application/json'
```

---

## Summary

| Action       | Method | Endpoint               | Body     | Auth  |
| ------------ | ------ | ---------------------- | -------- | ----- |
| Block User   | PATCH  | `/v1/user/:id/block`   | Required | Admin |
| Unblock User | PATCH  | `/v1/user/:id/unblock` | Empty    | Admin |

---

## Block Duration Units

| Unit        | Example    | Use Case              |
| ----------- | ---------- | --------------------- |
| `minutes`   | 30 minutes | Quick cooldown        |
| `hours`     | 1-24 hours | Short-term suspension |
| `days`      | 7 days     | Extended suspension   |
| `permanent` | N/A        | Permanent ban         |

---

## Common Use Cases

### 1. Spam Detection

```json
{
  "duration": 24,
  "unit": "hours",
  "isPermanent": false
}
```

### 2. Policy Violation

```json
{
  "duration": 30,
  "unit": "days",
  "isPermanent": false
}
```

### 3. Account Abuse

```json
{
  "isPermanent": true
}
```

### 4. Temporary Cooldown

```json
{
  "duration": 15,
  "unit": "minutes",
  "isPermanent": false
}
```

---

## Notes

- Only admins can block/unblock users
- Blocked users cannot access the platform
- Temporary blocks auto-expire based on `blockedUntil` date
- All block actions are logged in the database
- Email notifications can be sent to blocked users (if implemented)
