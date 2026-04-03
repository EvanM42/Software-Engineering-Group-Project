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
- created bus_stops table and added routes from [uga.pass](https://uga.passiogo.com/)
### Alex
### Daniel
- Refactored authentication UI (Login & Signup pages) for improved usability and visual hierarchy
- Redesigned form inputs to use a clean, white-based UI for better readability and accessibility
- Improved spacing, typography, and component structure to create a more modern and professional interface
- Implemented consistent styling across authentication components using shared CSS classes
- Enhanced user experience with better feedback states (error handling, loading states, and form validation messaging)
- Began restructuring frontend layout to support scalable components (Navbar, RouteCard, etc.)
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
- I was able to add all the routes to the supabase table for bus_stops
### Alex
### Daniel
- Focused on improving user experience by simplifying the visual design and removing cluttered or outdated UI elements
- Used consistent spacing, typography, and color hierarchy to make the interface more intuitive and easier to navigate
- Designed components in a reusable way to support future features like navigation and route filtering
- Prioritized readability and accessibility (clear inputs, better contrast, and user feedback messages)
- Ensured frontend structure aligns with backend data flow (Supabase integration and route handling)
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
