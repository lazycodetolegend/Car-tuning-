# Car Tuning Authentication Integration

## Overview
Secure REST API authentication powered by **Node.js, Express, MongoDB Atlas, and JWT tokens**.

## Architecture
- **JWT Bearer Authentication**: Signed with `JWT_SECRET`, returned upon registration/login, stored in `localStorage` under `tuning_app_token`.
- **Bcrypt Password Hashing**: Passwords hashed with bcrypt cost factor 12. Password hashes are never selected or returned in API responses.
- **RESTful Endpoints**:
  - `POST /api/auth/register` - Create account (returns token and user)
  - `POST /api/auth/login` - Authenticate user (returns token and user)
  - `GET /api/auth/me` - Get authenticated profile
  - `PATCH /api/auth/me` - Update profile details
- **Frontend Client (`js/api.js`)**:
  - Intercepts requests, attaches `Authorization: Bearer <token>`
  - Handles expired tokens (auto logout on 401)
  - Provides fallback status indicators for cold starts

## Security Features
- Express rate limiting on auth routes (10 requests per 15 minutes)
- Helmet security headers
- Strict CORS policy
- Express-validator input sanitization
- Zero client-side storage of plaintext credentials
