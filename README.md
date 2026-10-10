# Car Tuning — 3D Car Customization Studio

An interactive web application for configuring cars in real time. Browse a catalogue of
vehicles, load each one as a fully rendered 3D model in the browser, customize the paint and
wheels, and save your build to come back to later.

**Live demo:** https://car-tuning-sayam4.vercel.app
**API:** https://car-tuning-app.onrender.com/api

---

## Overview

Car configurators are the kind of interface manufacturers build to let customers visualise a
purchase before committing to it. This project is an independent implementation of that same
idea — a full-stack application where the 3D model, the catalogue, and the saved state all live
together behind a real authentication system.

The goal was not simply to render a model in a browser, but to build the pieces around it that
make it a product: accounts, persistence, shareable builds, and an asset pipeline efficient
enough to load real car geometry on an ordinary connection.

## Features

- **Vehicle catalogue** — 18 cars served from MongoDB, each with specifications (engine,
  power, torque, 0–60) and associated 3D geometry
- **Real-time 3D viewing** — every car loads as a glTF binary, rendered with Three.js and
  orbitable in the browser
- **Paint customization** — body materials flagged as paintable can be recoloured live
- **Wheel selection** — interchangeable rim and tyre sets applied to the loaded model
- **Accounts** — registration and login backed by JWT, with bcrypt-hashed passwords
- **Saved builds** — persist a configuration to the database and reload it later
- **Shareable builds** — optionally publish a build behind a public slug, read-only to anyone
- **Image uploads** — user images handled through Cloudinary rather than local disk

## Tech stack

| Layer | Technology |
|---|---|
| 3D rendering | Three.js, `GLTFLoader`, `DRACOLoader` |
| Frontend | HTML5, CSS3, JavaScript (ES6+), GSAP |
| Backend | Node.js, Express 4, Mongoose 8 |
| Database | MongoDB Atlas |
| Media storage | Cloudinary |
| Authentication | JSON Web Tokens, bcrypt |
| Deployment | Vercel (frontend), Render (API) |

## Project structure

```
backend/          Express API
  config/         Database connection
  controllers/    Route handlers
  middleware/     Authentication, validation, rate limiting, error handling
  models/         Mongoose schemas (User, Car, Build)
  routes/         Route definitions
  utils/          Seeding and helper scripts
  public/         API landing page

js/               Frontend scripts, including the API client in js/api.js
css/              Stylesheets
models/           Draco-compressed car geometry (~27 MB total)
rims/             Rim and tyre geometry (~1.7 MB total)
images/           Brand logos and interface imagery
audio/            Interface sound effects
```

## Getting started

### Backend

```bash
cd backend
cp .env.example .env      # then fill in the values below
npm install
npm run dev               # http://localhost:5000
```

The server validates its configuration at startup and **exits immediately** if any required
variable is missing, rather than falling back to a default value. This is deliberate: a fallback
secret is indistinguishable from a working one until it is exploited.

### Frontend

The frontend is static and needs no build step. Serve the repository root:

```bash
python3 -m http.server 5500
# then open http://localhost:5500
```

It reads its API base URL from `js/api.js`. Point it at `http://localhost:5000/api` for local
development.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Signing key for authentication tokens |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary account identifier |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |
| `NODE_ENV` | No | `production` enables rate limiting and strict CORS |
| `PORT` | No | Server port (default `5000`) |
| `JWT_EXPIRES_IN` | No | Token lifetime (default `7d`) |
| `CORS_ORIGIN` | No | Comma-separated allowlist of permitted origins |

## API reference

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Service and database status |
| `POST` | `/api/auth/register` | Public | Create an account |
| `POST` | `/api/auth/login` | Public | Obtain a JWT |
| `GET` | `/api/auth/me` | Authenticated | Current user profile |
| `PATCH` | `/api/auth/me` | Authenticated | Update current user |
| `GET` | `/api/cars` | Public | List all cars |
| `GET` | `/api/cars/:idOrSlug` | Public | Single car by ID or slug |
| `GET` | `/api/cars/:id/similar` | Public | Related cars |
| `POST` | `/api/cars` | Admin | Create a car |
| `PATCH` | `/api/cars/:id` | Admin | Update a car |
| `DELETE` | `/api/cars/:id` | Admin | Delete a car |
| `GET` | `/api/builds/mine` | Authenticated | Current user's builds |
| `POST` | `/api/builds` | Authenticated | Save a build |
| `GET` | `/api/builds/:id` | Owner | Read a build |
| `PATCH` | `/api/builds/:id` | Owner | Update a build |
| `DELETE` | `/api/builds/:id` | Owner | Delete a build |
| `GET` | `/api/builds/public/:shareSlug` | Public | Read a published build |
| `POST` | `/api/uploads/image` | Authenticated | Upload an image |
| `DELETE` | `/api/uploads/:publicId` | Owner | Remove an uploaded image |

Build endpoints verify ownership and return `404` rather than `403` for records belonging to
another user, so a response never confirms that a build exists.

## 3D asset pipeline

Car geometry is the largest part of this project and the part most likely to make it feel slow,
so it is treated as a build concern rather than an afterthought.

- Meshes are compressed with **Draco** before being committed — the catalogue ships at roughly
  **27 MB** rather than the several hundred megabytes of the source geometry
- Compressed files are decoded in the browser by `DRACOLoader`, configured against a CDN-hosted
  decoder so no local decoder build is required
- Textures and imagery are served with long-lived cache headers, so repeat visits do not
  re-download geometry

## Security posture

- Passwords hashed with bcrypt and excluded from query results by default
- JWT verification fails closed — no fallback secret exists in the codebase
- CORS restricted to an explicit allowlist using exact matching
- Credential endpoints rate limited separately from general API traffic
- Request payloads size-limited and validated before reaching handlers
- Configuration validated at startup, so a misconfigured deploy fails loudly

## Third-party assets

The 3D car and wheel models are **not** original work. They are third-party assets integrated
into this application, and the configurator — not the geometry — is what this project
contributes. Full credits and licensing notes are in [ATTRIBUTION.md](ATTRIBUTION.md), and
should be read before reusing anything from this repository.

## Licence

The application code is released under the MIT Licence. Third-party assets are covered by their
own licences, which may differ — see [ATTRIBUTION.md](ATTRIBUTION.md).