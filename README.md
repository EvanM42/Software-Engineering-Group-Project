# Project Overview

This project is an app for UGA bus transit and walking routes.
It shows UGA bus routes, their stops, and the buses currently enroute.
Users can use the search feature to find start and end stops, with the routes needed to go from start to end. 
Users can then save a route in order to easily find it again.

To access this app one must have a uga email, email confirmation will be sent as well.
- The URL for this app is: https://uga-transit.up.railway.app/

## Requirements

To use the live application, you only need the site URL and a UGA email address.

To run or modify the project locally, you will need:
- Node.js and npm installed
- Access to the Supabase project for authentication and database tables
- Access to the Railway project if you are using Railway for deployment
- Access to the Google Maps API key (this can be found in Railway)
- Internet access to the UGA Passio transit data feed (This is a variable in Railway)

## Installation

Clone the repo using the https: 
- https://github.com/EvanM42/Software-Engineering-Group-Project.git

Move into the folder:
- cd Software-Engineering-Group-Project

Install dependencies:
- npm install

Create a .env file based on the Railway variables

To run via localhost:
- npm run dev

To see the app running:
- https://uga-transit.up.railway.app/
- Railway uses the most recent successfully built push to main. This should mean the newest branch, however, if it does not update, it means there was an error which Railway will display.

## Environment setup

Create a `.env` file in the root of the project and add the following variables.
- NOTE: make sure .gitignore has `.env` in it

Your `.env` should contain:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_GOOGLE_MAPS_API_KEY
- VITE_PASSIO_BASE_URL
NOTE: all of these are in Raiway and can be found there

## Database setup

the app uses Supabase tables to extract data for bus stops and routes and user specific data
- `bus_stops` -> table for bus stops with RLS
- `bus_routes` -> table for bus routes with RLS
- `saved_routes` -> shows saved routes specific to user

Row-level security (RLS) is enabled, policies must allow:
- authenticated users to read the bus stop and route data
- authenticated users to create, view, and delete their own saved routes

## Running the app

To use the live version of the app, open the following URL in your browser:
- https://uga-transit.up.railway.app/

To run the app locally for development, use:
- npm run dev

## Testing

To check the project locally, run:
- `npm test` to run the test suite
- `npm run lint` to check code style and linting rules

# Tech Considerations

- Data source: UGA bus system API (check for GTFS / GTFS-RT feed availability)
- Mapping: Google Maps API
- Routing engine: Google Directions API
- State management: Saved routes in local storage and/or database (supabase)

## Data Sources

- UGA campus transit data is available through a GTFS feed provided by their Passio transit system.
- https://passio3.com/uga/passioTransit/gtfs/google_transit.zip
- Includes, route info, stop locations, scheduling data
- Mapping services via Google maps API
- provides a map rendering, directions, distance and ETA calculations

## Group Members

- Evan: Backend/Documentation
- Daniel: Frontend
- Alex: Backend
- Gopichand: Frontend/Testing
- Alan: Frontend

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

---

# Backend Services 

The following files were added to handle Google Directions and real-time UGA bus data.

## Environment Variables

All API keys are managed through a central config module (`src/config.js`).
You can find the keys in Railway.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |
| `VITE_GOOGLE_MAPS_API_KEY` | Yes | Google Maps API key (enable Directions API in Cloud Console) |
| `VITE_PASSIO_BASE_URL` | No | Passio transit base URL (defaults to UGA's endpoint) |

If any required keys are missing during development, the console will warn you.

## New Files

### `src/config.js`
Central configuration module. All services import API keys and URLs from here instead of reading `import.meta.env` directly.

### `src/services/directionsService.js`
Google Directions API integration. Provides:

- `getDirections(origin, destination, mode)` — fetches routes for a single travel mode (`'transit'` or `'walking'`)
- `getTransitAndWalking(origin, destination)` — fetches both transit and walking in parallel, returns whatever succeeds

Routes include distance, duration, step-by-step instructions, and transit details (bus line, stops, departure times).

### `src/services/busService.js`
UGA Passio GTFS-RT real-time bus data parser. Decodes protobufjs feeds and provides:

- `getVehiclePositions()` — current lat/lng, speed, bearing, and route for each active bus
- `getTripUpdates()` — predicted arrival/departure times for active trips
- `getArrivalsForStop(stopId)` — next buses arriving at a specific stop, sorted by time
- `getBusesOnRoute(routeId)` — all active buses on a given route
- `getBusSystemStatus()` — positions and predictions fetched in parallel

### `.env.example`
Template file showing all required environment variables with placeholder values.

## Modified Files

### `src/supabaseClient.js`
Now imports from `src/config.js` instead of reading `import.meta.env` directly.

### `vite.config.js`
Added dev server proxies so API calls avoid CORS and keep keys out of the browser:

| Local path | Proxied to |
|------------|-----------|
| `/api/directions` | `https://maps.googleapis.com/maps/api/directions/json` |
| `/passio-api/*` | `https://passio3.com/uga/passioTransit/*` |

### `.gitignore`
Updated to cover `.env.local` and `.env.*.local` while keeping `.env.example` tracked.

### `package.json`
- Added `protobufjs` dependency (for GTFS-RT protobuf decoding)
- Vite downgraded from v8 to v5 (fixes compatibility with Node.js 22.3)
