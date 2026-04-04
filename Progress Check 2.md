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
- set up the project with vite and npm
- obtained the Google API
- created the database in supabase
- deployed the Github onto Railway using the keys for supabase and google maps
- created an extremely bare minimum frontend
  - made this in order to allow me and Alex to work on the backend while the others work on the frontend
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
### Gopichand
### Alan
## Q2.1: why/how done well
### Evan
- I used vite and npm because I use it on my personal projects and I think it is a good starting place
  - npm also makes launching a local host easier, granted it is not really necessary with Railway
- I set up the Supabase DB so me and Alex can work on the backend and the frontend can ensure their work meshes with our
- I set up the Railway because it makes it easier to deploy and see the UI as the user would
- I got the Google API because we need it to show the transportation
  - I did it well by making sure it just has the APIs we need and restricted its access to only what is necessary
### Alex
- I set up thethe Directions API service handles both transit and walking modes in parallel so if one fails the other still returns something
- The bus data from GTFS-RT is presented a binary and not JSON so I have the bus data service decoding raw protobuf binary feeds
- I centralized all environment variables into a single config file with missing key warnings during development so people have an easy time adding any API keys we may need
- the Vite proxy setup keeps the Google API key off the client side during development which is better practice for security
### Daniel
### Gopichand
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
