# Frontend Architecture & Improvements

## Overview
Static multi-page web application for 3D car tuning configurator, powered by vanilla HTML5, CSS3, JavaScript, Three.js, and Google `<model-viewer>`. Backed by a Node.js + Express + MongoDB Atlas + Cloudinary REST API.

## Key Features
- **3D Configurator**: Three.js r146 with DRACOLoader and OrbitControls for custom tuning, real-time paint, rims, and performance customization.
- **Model Viewer**: Google `<model-viewer>` for responsive 3D model previews in brand selection and car catalog.
- **REST API Integration (`js/api.js`)**:
  - Centralized API fetching with JWT bearer authentication.
  - Automatic cold-start detection and user status feedback.
  - Persistence of custom builds to MongoDB Atlas.
- **Cloudinary Integration**: High performance image uploads and transformation (Sharp WebP optimization).
- **Responsive Layout**: Fluid CSS grid and flexbox layout across all devices.
