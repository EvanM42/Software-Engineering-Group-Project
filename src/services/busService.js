import protobuf from 'protobufjs'
import config from '../config'

// Build the full URLs from config pieces
const vehiclePositionsUrl = config.passio.baseUrl + config.passio.vehiclePositionsPath
const tripUpdatesUrl = config.passio.baseUrl + config.passio.tripUpdatesPath

// This is the GTFS-RT protobuf schema — it tells us how to decode the binary data
// that Passio sends back. We only define the fields we actually need.
const GTFS_RT_PROTO = `
syntax = "proto2";

message FeedMessage {
  required FeedHeader header = 1;
  repeated FeedEntity entity = 2;
}

message FeedHeader {
  required string gtfs_realtime_version = 1;
  optional uint64 timestamp = 2;
}

message FeedEntity {
  required string id = 1;
  optional TripUpdate trip_update = 3;
  optional VehiclePosition vehicle = 4;
}

message TripUpdate {
  optional TripDescriptor trip = 1;
  optional VehicleDescriptor vehicle = 3;
  repeated StopTimeUpdate stop_time_update = 2;
  optional uint64 timestamp = 4;
}

message StopTimeUpdate {
  optional uint32 stop_sequence = 1;
  optional string stop_id = 4;
  optional StopTimeEvent arrival = 2;
  optional StopTimeEvent departure = 3;
}

message StopTimeEvent {
  optional int64 time = 2;
  optional int32 delay = 3;
}

message VehiclePosition {
  optional TripDescriptor trip = 1;
  optional VehicleDescriptor vehicle = 8;
  optional Position position = 2;
  optional uint64 timestamp = 5;
  optional uint32 current_stop_sequence = 10;
  optional string stop_id = 7;
}

message Position {
  required float latitude = 1;
  required float longitude = 2;
  optional float bearing = 3;
  optional float speed = 5;
}

message TripDescriptor {
  optional string trip_id = 1;
  optional string route_id = 5;
  optional string start_time = 2;
  optional string start_date = 3;
}

message VehicleDescriptor {
  optional string id = 1;
  optional string label = 2;
  optional string license_plate = 3;
}
`

// We only parse the proto schema once and cache it
let cachedProtoRoot = null

function getProtoRoot() {
  if (!cachedProtoRoot) {
    cachedProtoRoot = protobuf.parse(GTFS_RT_PROTO, { keepCase: true }).root
  }
  return cachedProtoRoot
}

// Fetches a GTFS-RT binary feed, decodes the protobuf, and returns plain JS objects.
// In dev mode we route through Vite's proxy to dodge CORS issues.
async function fetchGtfsRtFeed(fullUrl) {
  const root = getProtoRoot()
  const FeedMessage = root.lookupType('FeedMessage')

  // In dev, swap the real URL for our local proxy path
  const fetchUrl = config.isDev
    ? `/passio-api/${fullUrl.replace(config.passio.baseUrl + '/', '')}`
    : fullUrl

  const response = await fetch(fetchUrl)
  if (!response.ok) {
    throw new Error(`Bus data feed returned ${response.status}`)
  }

  const buffer = await response.arrayBuffer()
  const decoded = FeedMessage.decode(new Uint8Array(buffer))
  return FeedMessage.toObject(decoded, { longs: Number })
}

// Where are the buses right now? Returns lat/lng, speed, and route for each active bus.
export async function getVehiclePositions() {
  const feed = await fetchGtfsRtFeed(vehiclePositionsUrl)

  return (feed.entity || [])
    .filter(entity => entity.vehicle)
    .map(entity => {
      const vehicle = entity.vehicle
      return {
        id: entity.id,
        vehicleId: vehicle.vehicle?.id || entity.id,
        vehicleLabel: vehicle.vehicle?.label || '',
        routeId: vehicle.trip?.route_id || '',
        tripId: vehicle.trip?.trip_id || '',
        latitude: vehicle.position?.latitude,
        longitude: vehicle.position?.longitude,
        bearing: vehicle.position?.bearing,
        speed: vehicle.position?.speed,
        stopId: vehicle.stop_id || '',
        timestamp: vehicle.timestamp ? new Date(vehicle.timestamp * 1000) : null,
      }
    })
}

// What's coming next? Returns predicted arrival/departure times for each active trip.
export async function getTripUpdates() {
  const feed = await fetchGtfsRtFeed(tripUpdatesUrl)

  return (feed.entity || [])
    .filter(entity => entity.trip_update)
    .map(entity => {
      const update = entity.trip_update
      return {
        id: entity.id,
        routeId: update.trip?.route_id || '',
        tripId: update.trip?.trip_id || '',
        vehicleId: update.vehicle?.id || '',
        timestamp: update.timestamp ? new Date(update.timestamp * 1000) : null,
        stopUpdates: (update.stop_time_update || []).map(stopTime => ({
          stopId: stopTime.stop_id || '',
          stopSequence: stopTime.stop_sequence,
          arrivalTime: stopTime.arrival?.time ? new Date(stopTime.arrival.time * 1000) : null,
          arrivalDelay: stopTime.arrival?.delay || 0,
          departureTime: stopTime.departure?.time ? new Date(stopTime.departure.time * 1000) : null,
          departureDelay: stopTime.departure?.delay || 0,
        })),
      }
    })
}

// When's the next bus at a specific stop? Useful for "nearby arrivals" features.
export async function getArrivalsForStop(stopId) {
  const allUpdates = await getTripUpdates()

  const arrivals = []
  for (const trip of allUpdates) {
    for (const stop of trip.stopUpdates) {
      if (stop.stopId === stopId && stop.arrivalTime) {
        arrivals.push({
          routeId: trip.routeId,
          tripId: trip.tripId,
          arrivalTime: stop.arrivalTime,
          delay: stop.arrivalDelay,
        })
      }
    }
  }

  // Soonest arrivals first
  arrivals.sort((a, b) => a.arrivalTime - b.arrivalTime)
  return arrivals
}

// Filters down to just the buses running on one route
export async function getBusesOnRoute(routeId) {
  const allPositions = await getVehiclePositions()
  return allPositions.filter(bus => bus.routeId === routeId)
}

// Gets everything at once — positions and predictions — for the full system overview.
export async function getBusSystemStatus() {
  const [positionsResult, updatesResult] = await Promise.allSettled([
    getVehiclePositions(),
    getTripUpdates(),
  ])

  return {
    vehicles: positionsResult.status === 'fulfilled' ? positionsResult.value : [],
    tripUpdates: updatesResult.status === 'fulfilled' ? updatesResult.value : [],
    errors: {
      vehicles: positionsResult.status === 'rejected' ? positionsResult.reason.message : null,
      tripUpdates: updatesResult.status === 'rejected' ? updatesResult.reason.message : null,
    },
    lastUpdated: new Date(),
  }
}
