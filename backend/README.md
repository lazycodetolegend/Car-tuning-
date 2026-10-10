# Car Tuning REST API Backend

Production-ready backend for the Car Tuning 3D Configurator, built with **Node.js 20, Express, Mongoose (MongoDB Atlas), and Cloudinary**.

---

## 🚀 Features

- **MongoDB Atlas Integration**: Scalable document storage with Mongoose models (`User`, `Car`, `Build`, `Project`).
- **Cloudinary Image Processing**: Direct memory uploads with Sharp optimization (resized to max 1600px, converted to WebP at quality 82).
- **JWT Bearer Authentication**: Bcrypt password hashing (cost factor 12) and secure JSON Web Tokens.
- **Strict Data Ownership**: Rigorous authorization checks ensuring users can only read and manage their own builds and uploads.
- **Hardened Security**: Helmet HTTP headers, CORS allowlist, Express rate limiting (10 requests / 15 min for auth, 100 / 15 min general), input validation and regex escaping with express-validator.
- **Fail-Fast Configuration**: Fails on startup if any critical environment variable is absent.
- **Zero Firebase Dependency**: Fully independent REST API replacing all legacy Firebase/Firestore code.

---

## 📋 Environment Variables

Create a `.env` file in the `backend/` directory based on `.env.example`:

| Variable | Description | Example |
|---|---|---|
| `PORT` | Local server port | `5000` |
| `NODE_ENV` | Runtime environment (`development` / `production` / `test`) | `development` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb://user:pass@cluster.mongodb.net/car-tuning-app?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secret key for signing JWT tokens (min 32 characters) | `random_long_secret_hash_value` |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account cloud name | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `123456789012345` |
| `CLOUDINARY_SECRET` | Cloudinary Secret (API Secret) | `your-secret-key` |
| `CORS_ORIGIN` | Comma-separated list of allowed origins | `https://your-app.vercel.app,http://localhost:5000` |

> ⚠️ **Security Warning**: Never commit `.env` or paste real credentials into git. All `.env` files are ignored by git.

---

## 🛠️ Local Development & Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your MongoDB Atlas and Cloudinary credentials:
```bash
cp .env.example .env
```

### 3. Seed Database
Seed all 18 car models and specifications into MongoDB Atlas:
```bash
npm run seed
```

### 4. Start Development Server
```bash
npm run dev
# Or for standard start:
npm start
```

### 5. Run Automated Tests
```bash
npm test
```

---

## 📡 API Reference

Base URL: `/api`

### 1. Health Check
- `GET /api/health` — Public uptime monitor endpoint. Returns `{ status: 'ok', db: 'connected' }`.

### 2. Authentication (`/api/auth`)
- `POST /api/auth/register` — Create account. Body: `{ email, password, username, firstName?, lastName? }`. Returns `201 { token, user }`.
- `POST /api/auth/login` — Sign in. Body: `{ email, password }`. Returns `200 { token, user }`. (Generic error for invalid credentials).
- `GET /api/auth/me` — Authenticated profile. Header: `Authorization: Bearer <token>`.
- `PATCH /api/auth/me` — Update profile. Body: `{ firstName?, lastName?, avatarUrl? }`.

### 3. Cars Catalog (`/api/cars`)
- `GET /api/cars` — List active cars. Query filters: `?brand=`, `?year=`, `?search=`, `?page=`, `?limit=`.
- `GET /api/cars/:idOrSlug` — Get single car by ID or slug. Automatically increments popularity counter.
- `GET /api/cars/:id/similar` — Get up to 6 same-brand cars.
- `POST /api/cars` — Admin only. Create car.
- `PATCH /api/cars/:id` — Admin only. Update car.
- `DELETE /api/cars/:id` — Admin only. Soft delete (`isActive = false`).

### 4. Custom Builds (`/api/builds`)
- `POST /api/builds` — Private. Save custom tuning build. Body: `{ car, name, paintColors, selectedRim, extras, isPublic }`. Returns `201`.
- `GET /api/builds/mine` — Private. Get caller's saved builds, newest first.
- `GET /api/builds/:id` — Private. Get single build (owner only; returns `404` if not found or belongs to another user).
- `PATCH /api/builds/:id` — Private. Update build (owner only).
- `DELETE /api/builds/:id` — Private. Delete build (owner only).
- `GET /api/builds/public/:shareSlug` — Public. View shared build where `isPublic === true`.

### 5. Uploads (`/api/uploads`)
- `POST /api/uploads/image` — Private. `multipart/form-data` with field `image` (JPEG/PNG/WebP, max 5MB). Processed with Sharp and stored in Cloudinary. Returns `{ secure_url, public_id }`.
- `DELETE /api/uploads/:publicId` — Private. Delete Cloudinary asset with caller ownership verification.

---

## 🚢 Render Deployment Guide

1. In the **Render Dashboard**, click **New +** → **Web Service**.
2. Connect your GitHub repository.
3. Set the following settings:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
4. Add the required Environment Variables in the Render settings:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN` (`7d`)
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_SECRET` (Cloudinary API Secret key)
   - `CORS_ORIGIN` (`https://<your-vercel-site>.vercel.app,http://localhost:5000`)
5. Click **Deploy Web Service**.
6. Once deployed, run the seed script from Render Shell or locally pointing `MONGODB_URI` to Atlas:
   ```bash
   npm run seed
   ```
7. Set up an uptime monitor targeting `https://<render-service-name>.onrender.com/api/health` every 10 minutes to prevent Render free-tier cold starts.
