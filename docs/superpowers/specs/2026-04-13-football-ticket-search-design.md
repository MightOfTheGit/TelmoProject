# Football Ticket Search Website — Design Spec

**Date:** 2026-04-13
**Status:** Approved

---

## Overview

A Next.js web application that lets users search for football match tickets by entering a match name (e.g. "Barcelona FC vs Real Madrid"). The app checks official club websites first, then queries SeatGeek and Ticketmaster APIs, and generates deep links to other ticket marketplaces. Results show the cheapest and most expensive tickets, stadium location per ticket, and source websites. Users can save searches and receive browser push notifications when prices change.

---

## Architecture

**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS

**Two layers:**

1. **Frontend** — React pages and components for search, results, saved searches, and notifications UI
2. **Backend API routes** (`/api/search`) — called by the frontend; fetches from official club pages, SeatGeek API, and Ticketmaster API in parallel; normalizes results into a unified format; returns them to the client

**Saved searches:** Stored in `localStorage` on the client — no database, no auth required. A background `useEffect` with `setInterval` re-runs saved searches every 30 minutes and triggers a browser push notification if new results differ from the last known prices.

---

## Pages & Components

### Pages

- `/` — Home: search bar where user types a match name, a "Search" button, and a saved searches panel below
- `/results?q=...` — Results page: loading state while fetching, then results grouped and sorted

### Key Components

- **Price summary card** — highlights cheapest ticket (price + source link) and most expensive ticket (price + source link)
- **Official Club Tickets banner** — highlighted section at the top of results if official club tickets are found; badged "Official" in the full list below
- **Ticket list** — each ticket shows: price, section/location in stadium, source website name + logo, "Buy" link, and "Official" badge where applicable
- **Stadium location badge** — labels derived from section name (e.g. "North Stand", "Lower Tier", "Behind Goal")
- **Source links panel** — for sites without API data, shows clickable "Search on Viagogo →" deep links that open pre-filled searches
- **Save Search button** — saves the query to localStorage and subscribes to browser push notifications
- **Toast notification** — appears bottom-right when search completes or when a saved search detects a price change; auto-dismisses after 5 seconds
- **Saved searches panel** — lists all saved searches with last checked time and last known cheapest price; includes "Remove" and "Re-check now" buttons per entry

---

## Data Flow

### Search Flow

1. User types match name and submits
2. Frontend calls `/api/search?q=<encoded-match-name>`
3. API route executes in parallel:
   - Checks official club websites (e.g. `fcbarcelona.com/tickets`, `realmadrid.com/tickets`) for ticket availability
   - Calls SeatGeek API
   - Calls Ticketmaster API
4. Results normalized into unified ticket shape:
   ```ts
   interface Ticket {
     price: number;
     currency: string;
     section: string;
     row?: string;
     source: string;       // e.g. "SeatGeek", "Ticketmaster", "FC Barcelona Official"
     sourceLogoUrl: string;
     url: string;
     isOfficial: boolean;
   }
   ```
5. Frontend receives array, sorts by price, extracts cheapest + most expensive, renders UI
6. On completion: in-page toast fires + browser push notification fires

### Deep Links Generated For

| Site | URL Pattern |
|------|-------------|
| Viagogo | `viagogo.com/search?q=<query>` |
| StubHub | `stubhub.com/find/s/?q=<query>` |
| LiveFootballTickets | `livefootballtickets.com/search?q=<query>` |
| Football Ticket Net | `football-ticket.net/search?q=<query>` |

### Official Club Page Check

- Clubs identified from the search query using a name-matching lookup (e.g. "barcelona" → `fcbarcelona.com/tickets`)
- Club ticket page is fetched server-side and checked for ticket availability indicators
- If tickets found, they appear in the "Official Club Tickets" banner at top and are badged "Official" in the main list
- Supported clubs list is maintained in a config file (`src/config/clubs.ts`)

### Saved Search Re-check

- Every 30 minutes, `localStorage` saved searches are re-fetched in the background
- If cheapest price drops or new tickets appear, browser push notification fires:
  > "Price drop! Barcelona vs Real Madrid — now from €89 on SeatGeek"

---

## Notifications

### Browser Push Notifications

- On first "Save Search", browser requests permission
- Fires when: saved search re-runs and detects price change or new availability
- Works even if the tab is in the background
- Uses the Web Push API (built into modern browsers, no third-party service)
- Notification format: `"Price drop! [Match] — now from [price] on [source]"`

### In-Page Toast

- Appears bottom-right on: search complete, saved search re-run, or push notification while tab is active
- Shows: match name, cheapest price found, source name
- Auto-dismisses after 5 seconds

---

## File Structure

```
src/
  app/
    page.tsx                  # Home: search + saved searches
    results/
      page.tsx                # Results page
    api/
      search/
        route.ts              # API route: fetch + normalize tickets
  components/
    SearchBar.tsx
    PriceSummaryCard.tsx
    OfficialTicketsBanner.tsx
    TicketList.tsx
    TicketCard.tsx
    StadiumLocationBadge.tsx
    SourceLinksPanel.tsx
    SaveSearchButton.tsx
    Toast.tsx
    SavedSearchesPanel.tsx
  hooks/
    useSavedSearches.ts       # localStorage read/write + interval re-check
    useNotifications.ts       # Web Push permission + trigger
  lib/
    seatgeek.ts               # SeatGeek API client
    ticketmaster.ts           # Ticketmaster API client
    clubScraper.ts            # Official club page checker
    normalizeTickets.ts       # Unify results into Ticket[]
    deepLinks.ts              # Generate marketplace deep links
  config/
    clubs.ts                  # Club name → official ticket URL mapping
  types/
    ticket.ts                 # Ticket interface
```

---

## Error Handling

- If SeatGeek or Ticketmaster API fails: show partial results with a warning banner
- If official club page check fails: silently omit, do not block results
- If no results found: show "No tickets found" state with deep links to all marketplaces
- All API errors logged server-side with context; user-facing messages never leak API keys or internal details

---

## Out of Scope

- User accounts or authentication
- Server-side database
- Payment processing
- Real-time price streaming
- Mobile app
