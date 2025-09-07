# 🚚 Truck Logbook Planner (React + Vite + Django REST)

A modern single-page app to plan truck trips and visualize FMCSA Hours-of-Service (HOS) logs. The frontend (React + Vite + Tailwind) collects locations and cycle hours, calls a Django REST backend that uses OSRM for routing, and renders a clean 24-hour daily logbook and route map. UI features a light, animated indigo→sky gradient background with glass cards, minimal typography, and subtle motion.

## ✨ Features

* Trip planner form with manual `lat,lng` input **and** quick USA suggestion chips (realistic demo routes).
* OSRM-powered routing: distances, durations, and legs.
* HOS-aware daily schedule planner: Off, Sleeper, Driving, On Duty; auto 30-min break; daily 10h off.
* Minimalist 24-hour logbook grid that **fits the screen width** (no horizontal scroll), with small labels and subtle animations.
* Interactive map (MapLibre): start/end markers, clean route casing, fade-in line, compact controls.
* Summary cards: Driving, On Duty, Sleeper, Off, plus On-Duty (incl. Driving).
* Pastel animated gradient background (indigo/sky) with glassmorphism cards.

## 🧩 Tech Stack

**Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Framer Motion (optional), MapLibre GL JS, React Hook Form + Zod
**Backend:** Django, Django REST Framework, Python 3.10+, OSRM API (public demo server)

## 📁 Project Structure

* `backend/` — Django project (`planning/` app: HOS planner, serializers, views, OSRM client)
* `frontend/` — React + Vite app (`src/pages` Plan & Results, `src/sections` LogGrid & MapView, `src/lib/api.ts`)
* `README.md`

## ⚙️ Prerequisites

* Node 18+ and npm (or pnpm/yarn)
* Python 3.10+ and pip
* (Optional) OSRM public demo is used by default; no extra setup needed

## 🚀 Quick Start

### 1) Backend (Django API)

1. `cd backend`
2. Create venv

   * Mac/Linux: `python3 -m venv .venv && source .venv/bin/activate`
   * Windows: `py -m venv .venv && .venv\Scripts\activate`
3. Install deps: `pip install -r requirements.txt`
4. Migrate DB: `python manage.py migrate`
5. Run dev server: `python manage.py runserver` → API at `http://localhost:8000`

API endpoint: `POST /api/plan`
Body: `{"current_location":"lat,lng","pickup_location":"lat,lng","dropoff_location":"lat,lng","current_cycle_used_hours":number}`

### 2) Frontend (React + Vite)

1. `cd frontend`
2. Install deps: `npm i`
3. (Optional) set API base (defaults to same-origin or proxy): create `.env` with `VITE_API_BASE=http://localhost:8000`
4. Dev server: `npm run dev` → UI at `http://localhost:5173`

**CORS/Proxy:** simplest is to hit `VITE_API_BASE` directly; or configure Vite dev proxy in `vite.config.ts` to `/api` → `http://localhost:8000`.

## 🔌 API Client (frontend `src/lib/api.ts`)

* Reads `import.meta.env.VITE_API_BASE || ''`.
* `planTrip(formValues)` → `POST {base}/api/plan` or `/api/plan`.

## 🗺️ Map & Logbook

* **MapView** (`src/sections/MapView.tsx`): MapLibre map, soft white casing + indigo line, start/end markers, compact attribution & nav controls, smooth fade-in, auto-fit bounds.
* **LogGrid** (`src/sections/LogGrid.tsx`): Minimal 24-hour SVG grid where **1440 minutes map to the viewBox width** so an entire day fits the screen. Thin grid lines, small hour labels (“M…N”), subtle segment fade/slide animation, compact transition posts, optional break highlight (OnDuty \~30 min). Summary cards appear above/below.

## 🧪 Sample Requests (USA-only to stay realistic for HOS)

Short demo that won’t exceed date limits:

* Current: `40.6892,-74.0445` (NYC Statue of Liberty)
* Pickup: `40.7306,-73.9352` (Brooklyn)
* Dropoff: `40.7527,-73.9772` (Midtown Manhattan)

Body:

```
{
  "current_location":"40.6892,-74.0445",
  "pickup_location":"40.7306,-73.9352",
  "dropoff_location":"40.7527,-73.9772",
  "current_cycle_used_hours": 2
}
```

If you see `Planning failed: date value out of range`, your legs are too long (e.g., intercontinental). Use regional USA routes or cap planning days server-side.

## 🧭 Planner Form (frontend `src/pages/PlanPage.tsx`)

* Fields: `current_location`, `pickup_location`, `dropoff_location`, `current_cycle_used_hours`
* Validation: Zod (`z.number().min(0).max(70)`; inputs cast via `valueAsNumber`)
* Suggestion chips (USA only) shown under each field; clicking a chip fills the input and highlights the selected chip.

## 🎨 UI/Theme Setup

### Tailwind

* Tailwind configured with basic content paths; used for gradient, cards, inputs, chips, buttons, grid.

### Animated Light Gradient Background (Indigo/Sky)

* In `frontend/index.css`:

```
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  @keyframes gradientShift {
    0% { background-position: 0% 50% }
    50% { background-position: 100% 50% }
    100% { background-position: 0% 50% }
  }
  .animate-gradient { background-size: 200% 200%; animation: gradientShift 14s ease infinite; }
}
```

* In `frontend/index.html`:

```
<body class="min-h-screen animate-gradient bg-gradient-to-r from-indigo-200 via-sky-200 to-indigo-300">
  <div id="root"></div>
</body>
```

* Wrap pages in a glass card for readability:
  `class="rounded-2xl bg-white/70 backdrop-blur-md shadow-md p-8"`

### Favicon & Tab Title

* Put `public/favicon.ico` (or `.png`/`.svg`).
* `frontend/index.html` `<head>`:
  `<link rel="icon" href="/favicon.ico" />` and `<title>Truck Logbook</title>`
* Set per-page title in React: `useEffect(() => { document.title = 'Plan Trip | Truck Logbook' }, [])`

## 🧱 Environment & Scripts

### Backend

* `python manage.py runserver` — dev API
* `python manage.py migrate` — migrations
* `pip freeze > requirements.txt` — lock deps (when you add any)

### Frontend

* `npm run dev` — dev server
* `npm run build` — production build (outputs `dist/`)
* `npm run preview` — preview prod build

**Env:** `.env` → `VITE_API_BASE=http://localhost:8000`

## 🐞 Troubleshooting

* **VS Code Pylance “rest\_framework could not be resolved”**
  Ensure venv is selected (Ctrl/Cmd+Shift+P → “Python: Select Interpreter”) and DRF installed in that venv.

* **CORS errors**
  Use `VITE_API_BASE` pointing at `http://localhost:8000` or configure Vite proxy; enable CORS on Django if calling from a different origin.

* **MapLibre typing error (attributionControl)**
  Set `attributionControl: false` in map options and add control via `new maplibregl.AttributionControl({ compact: true })`.

* **GeoJSON typing errors**
  Type `geo` as `Feature<LineString>` and cast positions to `[number, number]` tuples for bounds.

* **“date value out of range”**
  Use regional routes; optionally guard in planner: cap max simulated days (e.g., 365) and raise a helpful error.

## 🧩 Implementation Notes

* **Planner logic (backend)** walks legs and fills days respecting HOS:

  * 11h driving cap per day; 14h driving window; required 30-min break after 8h driving; 10h daily off.
  * Inserts breaks and fuel stops (if modeled); appends Pickup/Drop on-duty blocks.

* **Frontend logbook** uses SVG with `viewBox="0 0 1440 …"` so the **entire day stretches to container width**. Thin grid lines, compact labels (“OFF/SB/D/ON”), subtle motion on segments.

* **Map** uses a white “casing” under the indigo line for contrast on any basemap; start/end points are small dots with labels. Fit bounds on load.

## 📦 Deployment

**Frontend (Vercel/Netlify):**

* `npm run build`, deploy the `dist/` folder.
* Set `VITE_API_BASE` env var to your API URL.

**Backend (Railway/Render/Fly.io):**

* Provide `DJANGO_SECRET_KEY`, `ALLOWED_HOSTS`, and optional DB vars.
* Run migrations on boot; ensure OSRM access (public demo or your own instance).

## 🔮 Roadmap

* Autocomplete search (Mapbox/Google/Nominatim) to replace raw lat/lng typing.
* Export logbook PDF/CSV; shareable links.
* Multi-user auth + saved trips.
* Additional rule sets (Canada/EU).
* Mobile-first refinement and a11y passes.

## 📜 License

MIT © 2025

## 👤 Author

Truck Logbook Planner — built for a fast, clean HOS planning demo. Replace with your name/company and links as needed.
