# Basic Frontend Documentation — UGA Transportation App

## Overview

Frontend for a UGA campus transportation app that helps students navigate from Point A to Point B using bus routes and walking directions.

---

## Color Scheme

Based on UGA's official branding:

| Role            | Color         | Hex       |
|-----------------|---------------|-----------|
| Primary         | UGA Red       | `#BA0C2F` |
| Background      | White         | `#FFFFFF` |
| Text / Accents  | Black         | `#000000` |
| Secondary Text  | Dark Gray      | `#333333` |
| Surface / Card  | Light Gray     | `#F5F5F5` |

Usage guidelines:
- **Red** (`#BA0C2F`) — buttons, active states, route highlights, header/navbar background
- **Black** (`#000000`) — primary text, icons, borders
- **White** (`#FFFFFF`) — page background, card surfaces, text on red backgrounds
- **Dark Gray** (`#333333`) — secondary/body text
- **Light Gray** (`#F5F5F5`) — card backgrounds, input fields, subtle dividers

---

## Pages / Screens

### 1. Login
The first screen users see. Authentication is required to access saved routes tied to their account.

**Components:**
- UGA red header with app name/logo — "UGA Transit"
- Email input field
- Password input field
- "Log In" button — UGA red with white text
- "Sign Up" link — below login button, black text
- "Continue as Guest" link — below sign up, dark gray text (guest users cannot use saved routes)

**Behavior:**
- Successful login navigates to Home / Route Search
- Failed login shows an inline error message in red below the form
- "Sign Up" navigates to a registration form (email, password, confirm password)
- Guest users can search routes but the "Save This Route" button is disabled with a tooltip: "Log in to save routes"
- Auth state stored via Supabase Auth; session persists across visits

---

### 2. Home / Route Search
The main screen after login where users search for routes.

**Components:**
- Top navbar — UGA red background, white "UGA Transit" title/logo, black icons, user avatar/logout icon (top right)
- Origin input field
- Destination input field
- "Find Route" button — UGA red with white text
- Saved routes section — list of previously saved routes (if exists, else blank)

**Behavior:**
- On submit, navigates to the Route Results screen
- Saved routes load from Supabase on login; keyed to the authenticated user

---

### 3. Route Results
Displays available transit and walking options between two points.

**Components:**
- Header — origin → destination label
- Route cards (one per option):
  - Bus route card — bus number/name, stops, ETA, red accent on active stop
  - Walking route card — estimated walk time, distance
- Map view (Google Maps embed) — route drawn in red, stops marked in black
- "Save This Route" button — outlined red button

**Behavior:**
- Shows bus options pulled from UGA GTFS / Passio feed
- Shows walking directions from Google Directions API
- ETAs update in real time (GTFS-RT)
- Saving a route stores the origin/destination pair for reuse

---

### 4. Saved Routes
A list of the user's saved origin/destination pairs.

**Components:**
- Page title: "Saved Routes"
- List of saved route cards:
  - Origin → Destination label
  - "Get Directions" button — red
  - Delete/remove icon — black
- Empty state message if no routes saved

**Behavior:**
- Tapping "Get Directions" automatically inputs the saved route into the search fields and navigates to Route Results
- Routes persist via local storage or Supabase

---

### 5. Map View (Full Screen)
Full-screen map for visualizing routes.

**Components:**
- Google Maps embed filling the screen
- Floating bottom card — trip summary (route name, ETA)
- Back button — top left, black on white

**Behavior:**
- Route polyline drawn in UGA red
- Bus stop markers in black
- User location marker if location permission granted

---

## Mobile View

This app is mobile-first. The primary target is students using their phones on campus.

### General Principles
- Design for portrait orientation first
- All touch targets minimum **48x48px**
- Avoid hover-only interactions — use tap/press
- Inputs should trigger the appropriate mobile keyboard (email keyboard for email, default for search)
- No horizontal scrolling on any screen

### Layout
- Single-column layout throughout
- Full-width buttons on small screens
- Cards span full width with `16px` horizontal padding on the page
- Map view takes full screen height minus the bottom nav bar

### Navigation
- **Bottom navigation bar** (fixed) — primary navigation for mobile:
  - Home (search icon)
  - Saved Routes (bookmark icon)
  - Map (map pin icon)
- Top navbar retained for screen title and logout icon only
- Back navigation via OS gesture or a back arrow in the top left

### Screen-Specific Notes

| Screen        | Mobile Consideration |
|---------------|----------------------|
| Login         | Full-width inputs and button; logo centered above form |
| Home / Search | Origin/Destination inputs stacked vertically; "Find Route" full-width below |
| Route Results | Route cards scroll vertically; map collapses to a tappable preview that expands full screen |
| Saved Routes  | Full-width cards with swipe-to-delete gesture |
| Map View      | Full screen; floating bottom sheet for trip summary instead of a separate card |

### Breakpoints

| Breakpoint | Width      | Behavior                              |
|------------|------------|---------------------------------------|
| Mobile     | < 640px    | Single column, bottom nav bar         |
| Tablet     | 640–1024px | Wider cards, side-by-side inputs      |
| Desktop    | > 1024px   | Centered max-width layout, top nav only |

---

## Component Style Guide

### Navbar
```
Background: #BA0C2F
Text/Icons: #FFFFFF
Height: 56px
Font: Bold, 18px
```

### Buttons (Primary)
```
Background: #BA0C2F
Text: #FFFFFF
Border Radius: 8px
Padding: 12px 24px
Hover/Active: darken red ~10%
```

### Buttons (Secondary / Outlined)
```
Background: transparent
Border: 2px solid #BA0C2F
Text: #BA0C2F
Border Radius: 8px
```

### Input Fields
```
Background: #F5F5F5
Border: 1px solid #000000
Border Radius: 6px
Text: #000000
Placeholder: #999999
Padding: 10px 14px
```

### Route Cards
```
Background: #FFFFFF
Border: 1px solid #E0E0E0
Border Radius: 10px
Shadow: 0 2px 4px rgba(0,0,0,0.08)
Active route accent: left border 4px solid #BA0C2F
```

---

## Key Libraries / APIs

| Concern             | Tool                          |
|---------------------|-------------------------------|
| Map rendering       | Google Maps JavaScript API    |
| Directions / ETA    | Google Directions API         |
| Bus data            | UGA Passio GTFS / GTFS-RT feed |
| State / persistence | Supabase (user-scoped routes) |
| Authentication      | Supabase Auth                 |

---

## Responsibilities

| Member     | Role              |
|------------|-------------------|
| Daniel     | Frontend          |
| Gopichand  | Frontend / Testing |
| Evan       | Backend / Docs    |
| Alex       | Backend           |
| Alan       | Frontend          |

