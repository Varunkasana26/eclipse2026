# Computer Lab Booking Backend

Production-ready backend for a Computer Lab Booking app built with Node.js, Express, PostgreSQL, Prisma, and Supabase Auth.

## Features

- REST API for computers, bookings, health, and auth
- PostgreSQL with Prisma ORM
- Supabase Auth for signup/login and access-token verification
- Zod validation for requests
- Centralized error handling
- Swagger/OpenAPI docs at `/docs`
- Pagination-ready list endpoints
- Business rules for booking conflicts and cancellation ownership
- Jest tests for booking rules
- Fail-fast environment validation and configurable CORS origins

## Folder Structure

```text
backend/
  prisma/
    schema.prisma
    seed.js
  src/
    app.js
    server.js
    config/
      env.js
    controllers/
      auth.controller.js
      bookings.controller.js
      computers.controller.js
      health.controller.js
    db/
      prisma.js
    docs/
      openapi.js
    middleware/
      auth.middleware.js
      error.middleware.js
      validate.middleware.js
    routes/
      auth.routes.js
      bookings.routes.js
      computers.routes.js
      health.routes.js
    services/
      auth.service.js
      bookings.service.js
      computers.service.js
    utils/
      app-error.js
      pagination.js
      response.js
      time-slots.js
    validators/
      auth.validators.js
      booking.validators.js
      computer.validators.js
  tests/
    bookings.service.test.js
  .env.example
  package.json
  jest.config.js
```

## Setup

1. Install dependencies

```bash
npm install
```

2. Create your environment file

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Make sure PostgreSQL is running and create a database named `computer_lab_booking`

4. Run Prisma migration and generate the client

```bash
npx prisma migrate dev --name init
```

5. Seed sample data

```bash
npm run db:seed
```

## Run

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

Swagger docs:

`http://localhost:5000/docs`

Health endpoint:

`http://localhost:5000/health`

## Environment Variables

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/computer_lab_booking?schema=public
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_AUTH_REDIRECT_URL=http://localhost:5173/auth/callback
```

## API Contract

### `GET /health`

Response:

```json
{
  "success": true,
  "message": "Server is healthy.",
  "data": {
    "status": "ok",
    "environment": "development",
    "timestamp": "2026-04-01T10:30:00.000Z"
  }
}
```

### `POST /auth/signup`

Request:

```json
{
  "name": "Aarav Sharma",
  "email": "aarav@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "success": true,
  "message": "User created successfully.",
  "data": {
    "user": {
      "id": "a-user-id",
      "name": "Aarav Sharma",
      "email": "aarav@example.com",
      "createdAt": "2026-04-01T10:30:00.000Z"
    },
    "session": {
      "accessToken": "supabase-access-token",
      "refreshToken": "supabase-refresh-token",
      "expiresAt": 1775041800,
      "expiresIn": 3600,
      "tokenType": "bearer"
    },
    "requiresEmailConfirmation": false
  }
}
```

If email confirmation is enabled in Supabase, the response can return `"session": null` and `"requiresEmailConfirmation": true` until the user verifies their email.

### `POST /auth/login`

Request:

```json
{
  "email": "aarav@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": "a-user-id",
      "name": "Aarav Sharma",
      "email": "aarav@example.com",
      "createdAt": "2026-04-01T10:30:00.000Z"
    },
    "session": {
      "accessToken": "supabase-access-token",
      "refreshToken": "supabase-refresh-token",
      "expiresAt": 1775041800,
      "expiresIn": 3600,
      "tokenType": "bearer"
    },
    "requiresEmailConfirmation": false
  }
}
```

### `GET /computers?page=1&pageSize=10`

Response:

```json
{
  "success": true,
  "message": "Computers fetched successfully.",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Lab-A-01",
        "location": "Main Lab",
        "description": "High performance workstation",
        "active": true,
        "createdAt": "2026-04-01T10:30:00.000Z",
        "updatedAt": "2026-04-01T10:30:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "pageSize": 10,
      "totalItems": 1,
      "totalPages": 1
    }
  }
}
```

### `GET /computers/:id/availability?date=2026-04-10`

Response:

```json
{
  "success": true,
  "message": "Computer availability fetched successfully.",
  "data": {
    "computer": {
      "id": 1,
      "name": "Lab-A-01",
      "location": "Main Lab",
      "description": "High performance workstation",
      "active": true
    },
    "date": "2026-04-10",
    "timeSlots": [
      {
        "slot": "09:00-10:00",
        "isBooked": false
      },
      {
        "slot": "10:00-11:00",
        "isBooked": true
      }
    ]
  }
}
```

### `GET /bookings?userId=550e8400-e29b-41d4-a716-446655440000&page=1&pageSize=10`

Response:

```json
{
  "success": true,
  "message": "Bookings fetched successfully.",
  "data": {
    "items": [
      {
        "id": "booking-id",
        "date": "2026-04-10",
        "timeSlot": "10:00-11:00",
        "status": "ACTIVE",
        "computer": {
          "id": 1,
          "name": "Lab-A-01",
          "location": "Main Lab"
        }
      }
    ],
    "meta": {
      "page": 1,
      "pageSize": 10,
      "totalItems": 1,
      "totalPages": 1
    }
  }
}
```

### `POST /bookings`

Request:

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "computerId": 1,
  "date": "2026-04-10",
  "timeSlot": "10:00-11:00"
}
```

Success response:

```json
{
  "success": true,
  "message": "Booking created successfully.",
  "data": {
    "id": "booking-id",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "computerId": 1,
    "date": "2026-04-10",
    "timeSlot": "10:00-11:00",
    "status": "ACTIVE",
    "createdAt": "2026-04-01T10:30:00.000Z",
    "updatedAt": "2026-04-01T10:30:00.000Z"
  }
}
```

Conflict response:

```json
{
  "success": false,
  "message": "This computer is already booked for the selected date and time slot."
}
```

### `DELETE /bookings/:id?userId=550e8400-e29b-41d4-a716-446655440000`

Success response:

```json
{
  "success": true,
  "message": "Booking cancelled successfully.",
  "data": {
    "id": "booking-id",
    "status": "CANCELLED"
  }
}
```

Forbidden response:

```json
{
  "success": false,
  "message": "You can cancel only your own booking."
}
```

## Business Rules

- A booking is unique for the same `computerId + date + timeSlot`
- Only the booking owner can cancel their booking
- Availability is returned for a specific computer and date
- List endpoints return `items` and `meta` so pagination can be expanded later

## Test Instructions

Run unit tests:

```bash
npm test
```

Current tests cover:

- preventing double booking for the same computer, date, and time slot
- preventing users from cancelling someone else's booking
- returning a clean `409` conflict if simultaneous booking requests collide at the database layer

## Notes

- The frontend can use `userId` directly for now, or later pass the Supabase access token as `Authorization: Bearer <token>`
- Supabase Auth is the source of truth for signup/login, and the backend mirrors the authenticated user into the local Prisma `users` table
- Swagger docs are generated from a local OpenAPI object, so they stay easy to edit
- CORS supports a comma-separated `CORS_ORIGINS` list for local React apps
