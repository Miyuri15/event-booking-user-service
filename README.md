# User Service

`user-service` is the microservice responsible for user registration, authentication, profile management, and the user-to-booking integration required by the assignment.

## What This Service Covers

- Register a new user
- Support `USER` and `ADMIN` roles
- Login and issue JWT tokens
- Get all users
- Get the logged-in user's profile
- Get, update, and delete a specific user
- Fetch a user's bookings from Booking Service
- Expose an internal user-validation endpoint for Booking Service
- Send in-app notifications for registration, login, profile updates, and account deletion
- Seed one default admin account when the service starts

## Project Structure

```text
user-service/
|-- src/
|   |-- config/
|   |   `-- db.js
|   |-- controllers/
|   |   `-- user.controller.js
|   |-- middleware/
|   |   |-- auth.middleware.js
|   |   |-- authorizeSelf.middleware.js
|   |   |-- errorHandler.js
|   |   `-- serviceAuth.middleware.js
|   |-- models/
|   |   `-- user.model.js
|   |-- routes/
|   |   `-- user.routes.js
|   |-- services/
|   |   `-- user.service.js
|   |-- utils/
|   |   |-- httpError.js
|   |   |-- jwt.js
|   |   `-- userValidation.js
|   `-- app.js
|-- swagger/
|   `-- swagger.yaml
|-- .github/
|   `-- workflows/
|       `-- user-service-ci.yml
|-- Dockerfile
|-- .dockerignore
|-- .env.example
|-- package.json
|-- package-lock.json
`-- server.js
```

## Environment Variables

Create a `.env` file using `.env.example`.

```env
PORT=8080
MONGO_URI=your_mongo_uri
JWT_SECRET=your_secret
BOOKING_SERVICE_URL=http://localhost:8082
BOOKING_SERVICE_TIMEOUT_MS=5000
NOTIFICATION_SERVICE_URL=http://localhost:8085
NOTIFICATION_SERVICE_TIMEOUT_MS=5000
INTERNAL_SERVICE_TOKEN=shared_service_secret
DEFAULT_ADMIN_NAME=System Admin
DEFAULT_ADMIN_EMAIL=admin@eventbooking.com
DEFAULT_ADMIN_PASSWORD=Admin123!
```

## Run Locally

```bash
npm install
npm run dev
```

Service URLs:

- API base: `http://localhost:8080/api/users`
- Swagger: `http://localhost:8080/api-docs`

## API Endpoints

### Public

- `POST /api/users/register`
- `POST /api/users/login`

### Protected with JWT

- `POST /api/users/admins` (admin only)
- `GET /api/users/admins` (admin only)
- `PUT /api/users/admins/:id` (admin only)
- `DELETE /api/users/admins/:id` (admin only)
- `GET /api/users` (admin only)
- `GET /api/users/me`
- `GET /api/users/:id`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`
- `GET /api/users/:id/bookings`

### Internal Service-to-Service

- `GET /api/users/internal/:id/exists`
  Required header: `x-service-token: <INTERNAL_SERVICE_TOKEN>`

## Suggested Booking Service Integration

Booking Service can validate a user with:

```http
GET /api/users/internal/{userId}/exists
x-service-token: shared_service_secret
```

Expected response:

```json
{
  "exists": true,
  "user": {
    "_id": "67d7d4dcf89bc5fbeb0bf12a",
    "name": "Anuja Silva",
    "email": "anuja@gmail.com",
    "createdAt": "2026-03-17T14:10:00.000Z",
    "updatedAt": "2026-03-17T14:10:00.000Z"
  }
}
```

## Demo Flow

1. Start the service and login with the default admin account.
2. Use the admin token to call `POST /api/users/admins` if you want to create more admins.
3. Register a normal user through `POST /api/users/register`.
4. Login and copy the JWT token.
5. Call `GET /api/users/me` with `Authorization: Bearer <token>`.
6. Call `GET /api/users/{id}/bookings` after Booking Service is running.
7. Show Booking Service validating users through `/api/users/internal/{id}/exists`.

## Notes

- Passwords are hashed with `bcryptjs`.
- Password hashes are not returned in API responses.
- Self-registration always creates a `USER`.
- Admin accounts cannot self-register and must be created by an authenticated admin.
- A user can only access their own `/:id` profile routes with JWT auth, while admins can access all user profiles.
- Swagger is available for documentation and demo support.
