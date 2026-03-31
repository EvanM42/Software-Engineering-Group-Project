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
