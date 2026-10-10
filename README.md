# Car Tuning — 3D Car Customization Studio

An interactive web app where you pick a car, load it as a real 3D model in the browser,
and customize it — paint, rims, and saved builds you can come back to.

**Live demo:** https://car-tuning-sayam4.vercel.app
**API:** https://car-tuning-app.onrender.com/api

## What it does

- **Car catalogue** — 18 models served from MongoDB, each with specs (engine, power, torque, 0–60)
- **Real 3D viewing** — every car loads as a Draco-compressed `.glb` rendered with Three.js
- **Customization** — paintable body materials and switchable rim sets
- **Accounts** — register and log in, backed by JWT auth
- **Saved builds** — store a configuration and reload it later, optionally shared via a public link
- **Image uploads** — Cloudinary handles user-uploaded images

## Stack

| Layer | Technology |
|---|---|
| 3D / frontend | Three.js, GLTFLoader, GSAP, vanilla JS |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB Atlas |
| Media | Cloudinary |
| Auth | JWT (bcrypt-hashed passwords) |
| Hosting | Vercel (frontend) + Render (API) |

## Layout

```
backend/     Express API — models, routes, controllers, middleware
js/          Frontend scripts, including the API client in js/api.js
css/         Styles
models/      Draco-compressed car models (~27 MB total)
rims/        Rim and tire models
images/      Brand logos and UI imagery
audio/       Interface sound effects
```

## Running locally

Backend:

```bash
cd backend
cp .env.example .env    # then fill in the values
npm install
npm run dev
```

Frontend: serve the repository root with any static server, for example
`python3 -m http.server 5500`, then open `http://localhost:5500`.

The frontend reads its API base URL from `js/api.js` and falls back to the deployed API.

## Notes

- Model files are Draco-compressed. The Three.js DRACOLoader is configured against a CDN
  decoder, so the compressed models load without a local decoder build.
- The API validates all configuration through environment variables at startup and exits
  immediately if any required value is missing, rather than falling back to a default.
