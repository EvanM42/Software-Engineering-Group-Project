# Bus Stops — Supabase Table

## Table Schema

```sql
create table bus_stops (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  route_names text[],
  created_at timestamp with time zone default now()
);
```

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Auto-generated unique ID |
| `name` | text | Name of the bus stop |
| `lat` | double precision | Latitude coordinate |
| `lng` | double precision | Longitude coordinate |
| `route_names` | text[] | Array of route names this stop belongs to (e.g. `["Blue", "Red"]`) |
| `created_at` | timestamp | Auto-generated timestamp |

---

## Row Level Security (RLS)

Run in Supabase SQL Editor after creating the table:

```sql
alter table bus_stops enable row level security;

create policy "Public read access"
  on bus_stops for select
  using (true);
```

This allows anyone to read bus stop data but prevents frontend users from inserting or deleting rows.

---

## Querying from React

**Get all stops:**
```js
const { data: stops, error } = await supabase
  .from('bus_stops')
  .select('*')
```

**Filter by route:**
```js
const { data: stops, error } = await supabase
  .from('bus_stops')
  .select('*')
  .contains('route_names', ['Blue'])
```

---

## Data Sources

UGA bus stop coordinates can be found at:
- [UGA Transit](https://transit.uga.edu) — official route maps
- UGA GTFS feed — public transit data format with exact stop coordinates

---

## Notes

- `route_names` is an array so one stop can belong to multiple routes
- Data is populated manually via the Supabase table editor or SQL insert statements
- This table is read-only from the frontend; data is managed directly in Supabase
