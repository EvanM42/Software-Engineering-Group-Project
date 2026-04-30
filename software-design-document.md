# Software Design Document — UGA Transit

## Architecture

```
Browser (React + Vite SPA)
  ├── Google Maps JS API        — map rendering, route polylines
  ├── /api/directions           — proxy → Google Directions API
  ├── /passio-api/*             — proxy → UGA GTFS-RT feed (reference only)
  ├── Supabase                  — auth + database
  └── Railway                   — deployment / CI/CD from main
```

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React, Vite                         |
| Maps       | Google Maps JS API                  |
| Routing    | Google Directions API               |
| Auth / DB  | Supabase                            |
| Deployment | Railway (auto-deploy from main)     |

Routing was originally going to be done with passio-api and passiogo, however safeguards forced us to adapt.
This is also discuessed at the end of the documentation.

## Database Schema

**bus_stops**
| Column      | Type        |
|-------------|-------------|
| id          | uuid (PK)   |
| name        | text        |
| lat         | float       |
| lng         | float       |
| route_names | text        |
| created_at  | timestamptz |

**routes**
| Column       | Type      |
|--------------|-----------|
| myid         | text (PK) |
| name         | text      |
| short_name   | text      |
| color        | text      |
| group_id     | text      |
| latitude     | float     |
| longitude    | float     |
| is_active    | bool      |
| show_schedule| bool      |

**saved_routes**
| Column      | Type        |
|-------------|-------------|
| id          | uuid (PK)   |
| user_id     | uuid (FK → auth.users.id) |
| origin      | text        |
| destination | text        |
| created_at  | timestamptz |

Row-Level Security is enabled on all tables. Authenticated users can read bus/route data and create, view, and delete only their own saved routes.

## Frontend

**Pages**
- `Login / Signup` — Supabase auth, UGA email check, email confirmation, error feedback
- `Home` — origin & destination inputs, saved routes panel, and inline route results (RouteCard components with ETAs, walking option, embedded map)

**Key Components**
- `Navbar` — nav links, logout trigger
- `BusMap` — Google Maps with live bus markers
- `RouteCard` — displays a route with bus/walk data
- `StopCard` — renders stop info
- `StopAutocomplete` — location search with autocomplete
- `LogoutModal` — logout confirmation
- `AuthGuard` — redirects unauthenticated users

**Design**
- UGA brand colors: `#BA0C2F` red, white, black
- Mobile-first, single-column layout
- Breakpoints: `<640px` / `640–1024px` / `>1024px`
- 48×48 px minimum touch targets

## Backend Services

**`src/config.js`**
Central module for all API keys and URLs. All services import from here.

**`src/services/directionsService.js`**
- `getDirections(origin, destination, mode)` — fetches routes for `'transit'` or `'walking'`
- `getTransitAndWalking(origin, destination)` — fetches both in parallel, returns whichever succeeds

Returns distance, duration, step-by-step instructions, and transit details (bus line, stops, times).

**`src/lib/supabaseClient.js`**
Initializes the Supabase client using keys from `src/config.js`.

**`src/contexts/AuthContext.jsx`**
Wraps the app with Supabase auth state. Provides current user and session to all components.

**`src/hooks/useBusStops.js`** / **`src/hooks/useBusRoutes.js`**
Custom hooks that fetch and cache bus stop and route data from Supabase.

## Environment Variables

| Variable                | Required | Description                  |
|-------------------------|----------|------------------------------|
| `VITE_SUPABASE_URL`     | Yes      | Supabase project URL         |
| `VITE_SUPABASE_ANON_KEY`| Yes      | Supabase anonymous key       |
| `VITE_GOOGLE_MAPS_API_KEY` | Yes      | Google Maps API key          |
| `VITE_PASSIO_BASE_URL`     | No       | Passio GTFS-RT base URL (falls back to default if omitted) |

All of these are in railway and can be run through the URL: uga-transit.up.railway.app

## Vite Dev Proxies

| Local Path        | Proxied To                              |
|-------------------|-----------------------------------------|
| `/api/directions` | `https://maps.googleapis.com/...`       |
| `/passio-api/*`   | `https://passio3.com/uga/passioTransit/*` |

Proxies keep API keys out of the browser during development.

## Data Source Decision

Passio GTFS-RT was explored but proved unreliable (protobuf decode failures, route mismatches).
Google Maps Directions API is the primary runtime source for route search, map visualization, and arrival times. GTFS data remains in Supabase as a reference dataset only.
