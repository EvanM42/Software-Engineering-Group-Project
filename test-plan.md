# Test Plan — UGA Transit

## Framework

- **Test runner:** Vitest
- **Component testing:** React Testing Library
- **Linting:** ESLint

## Running Tests

```bash
npm test       # run full test suite
npm run lint   # check code style and linting
```

## Test Files

| File               | What It Covers                              |
|--------------------|---------------------------------------------|
| `AuthContext`      | Auth state management                       |
| `AuthGuard`        | Route protection and redirects              |
| `Login`            | Form validation and auth calls              |
| `Signup`           | Registration and UGA email check            |
| `Home`             | Route search and saved routes               |
| `BusMap`           | Map rendering with live bus positions       |
| `Navbar`           | Nav links and logout trigger                |
| `RouteCard`        | Route card with bus and walking data        |
| `StopCard`         | Stop info rendering                         |
| `StopAutocomplete` | Location search autocomplete                |
| `useBusStops`      | Custom hook: fetch and cache bus stops      |
| `LogoutModal`      | Modal visibility, cancel/confirm actions, loading/disabled states, overlay click |

12 test files covering authentication, UI components, and data layers.

## Coverage Areas

- **Authentication** — login, signup, session state, UGA email enforcement, route guards
- **UI Components** — rendering, user interactions, error/loading states
- **Data Layer** — API calls, hook behavior, data fetching and caching
