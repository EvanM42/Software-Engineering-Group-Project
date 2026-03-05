# Software-Engineering-Group-Project

## Project Overview - UGA Transportation
- app for bus routes and walking routes for UGA students
- goal: make getting from Point A to Point B easier

### How to Achieve Goal
- UGA bus routes
  - realtime tracking
- route and time from Point A to Point B
  - ex: physics building to ramsey
  - show viable bus routes with stops
  - show walking route 
- saving bus routes
  - allow people to save a route, like physics to ramsey, so they do not have to input it again
- show time/eta for bus and walking
 
## Tech Considerations
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
- Alan: 
