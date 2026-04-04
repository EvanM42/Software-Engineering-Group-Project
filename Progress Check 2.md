# Progress Check 2
## Team
| Member      | Roles                |
|-------------|----------------------|
| Evan        | Documentation/Backend|
| Alex        | Backend              |
| Gopichand   | Testing/Fronted      |
| Daniel      | Frontend             |
| Alan        | Fronted              |

## Q2: accomplished so far
### Evan
- Set up the project with vite and npm
- Obtained the Google API
- Created the database in supabase
- Deployed the Github onto Railway using the keys for supabase and google maps
- Created an extremely bare minimum frontend
  - Made this in order to allow me and Alex to work on the backend while the others work on the frontend
- Created bus_stops table and added routes from [uga.pass](https://uga.passiogo.com/)
### Alex
- built the Google Directions API service to fetch transit and walking routes between locations
- built the UGA bus real-time data service that parses GTFS-RT protobuf feeds from Passio for live bus positions and arrival predictions
- created a central config module so all API keys and URLs are managed in one place instead of scattered across files
- created a .env.example template so teammates can set up their environment quickly
- updated supabaseClient.js to pull credentials from the central config
- set up Vite dev server proxies for the Google Directions API and Passio GTFS-RT feeds to keep API keys out of the browser
- updated .gitignore to cover additional .env file
- downgraded Vite from v8 to v5 to fix a Node.js compatibility issue that was breaking my builds
### Daniel
- Refactored authentication UI (Login & Signup pages) for improved usability and visual hierarchy
- Redesigned form inputs to use a clean, white-based UI for better readability and accessibility
- Improved spacing, typography, and component structure to create a more modern and professional interface
- Implemented consistent styling across authentication components using shared CSS classes
- Enhanced user experience with better feedback states (error handling, loading states, and form validation messaging)
- Began restructuring frontend layout to support scalable components (Navbar, RouteCard, etc.)
### Gopichand
- Set up Supabase authentication securely and developed fully functional Login and Signup pages.
- Refactored the application into a clean, modular route-based structure using React Router.
- Integrated the Google Maps API featuring modern `AdvancedMarkerElement`s to visualize UGA bus stops.
- Built intelligent React components, including an interactive autocomplete location search and Nearby Stops locator.
- Established an extensive automated testing suite using Vitest (80 passing tests out of 12 suites) for all new layers.
### Alan
## Q2.1: why/how done well
### Evan
- Used vite and npm for project set up because I have found it useful on many project as a starting point
  - npm also makes launching a local host easier, granted it is not really necessary with Railway
- Set up the Supabase DB so we can create the backend promptly and in line with the frontend
- Set up the Railway to deploy the project when complete
- Got the Google API because we need it to show the transportation
  - Made sure it just has the APIs we need and restricted its access to only what is necessary
- Added all the routes to the supabase table for bus_stops
### Alex
- I set up thethe Directions API service handles both transit and walking modes in parallel so if one fails the other still returns something
- The bus data from GTFS-RT is presented a binary and not JSON so I have the bus data service decoding raw protobuf binary feeds
- I centralized all environment variables into a single config file with missing key warnings during development so people have an easy time adding any API keys we may need
- the Vite proxy setup keeps the Google API key off the client side during development which is better practice for security
### Daniel
- Focused on improving user experience by simplifying the visual design and removing cluttered or outdated UI elements
- Used consistent spacing, typography, and color hierarchy to make the interface more intuitive and easier to navigate
- Designed components in a reusable way to support future features like navigation and route filtering
- Prioritized readability and accessibility (clear inputs, better contrast, and user feedback messages)
- Ensured frontend structure aligns with backend data flow (Supabase integration and route handling)
### Gopichand
- Secured the framework by adopting Test-Driven Development (TDD) via Vitest and the React Testing Library.
- Optimized user experience by combining clean UI refactoring with seamless interactive map visualizations without disrupting the interface.
- Wrote maintainable code by abstracting backend data fetching into scalable, custom React hooks (like `useBusStops`).
- Protected application longevity by migrating deprecated APIs to the newest Google Maps DOM marker recommendations.
- Included comprehensive client-side error handling to gracefully manage absent database tables and location hardware.
### Alan 
## Q3: activities not accommplished or progress has fallen behind
- currently nothing, we are on track
## Q3.1: reasons activities slower/not done
- Some activities may have been slower due to work load from other classes, however the slow down was not significant 
## Q4: main focus/priority 
- main focus:
  - frontend: get essentials completed (login, map, and bookmarked/saved routes pages)
  - backend: have users table, bookmark table, and link users to bookmark
    - Google API at least 50% working
