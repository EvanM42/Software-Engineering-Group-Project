# Software Requirements Specification — UGA Transit

## Overview

A web app for UGA students to navigate campus using bus routes and walking directions.
Combines real-time bus tracking, route search, and saved routes in one interface.

**URL:** https://uga-transit.up.railway.app/

## Problem

UGA students rely on buses and walking daily. Existing tools are fragmented — no single place for live bus data, walking directions, and saved trips.

## Functional Requirements

| # | Requirement |
|---|-------------|
| 1 | Users must sign up and log in with a UGA email (email confirmation required) |
| 2 | Users can search routes by entering a start and end location |
| 3 | The map displays live bus positions |
| 4 | Users can view walking directions as an alternative to bus routes |
| 5 | Authenticated users can save routes and retrieve them later |
| 6 | Saved routes can be re-launched or deleted |
| 7 | Guest users can search routes but cannot save them |

## Non-Functional Requirements

| Category      | Requirement |
|---------------|-------------|
| Performance   | Real-time bus data refreshes without a full page reload |
| Usability     | Mobile-first layout; 48×48 px minimum touch targets |
| Security      | API keys stored in server-side env variables; Supabase Row-Level Security per user |
| Accessibility | UGA brand colors with sufficient contrast; no hover-only interactions |
| Reliability   | Railway auto-deploys from main; rolls back on build errors |
| Scalability   | Stateless React frontend; Supabase handles user data at scale |
