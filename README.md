# Football Ticket Search

Search for football match tickets across official club websites, SeatGeek, Ticketmaster, and more — all in one place.

## Features

- Search any match (e.g. "Barcelona FC vs Real Madrid")
- Official club tickets highlighted first with an "Official" badge
- Cheapest and most expensive ticket summary
- Stadium section location shown per ticket
- Direct links to Viagogo, StubHub, LiveFootballTickets, Football Ticket Net
- Save searches and receive browser notifications on price drops
- Automatic re-check every 30 minutes for saved searches

## Setup

1. Clone the repo
2. Copy `.env.local.example` to `.env.local` and add your API keys:
   - `SEATGEEK_CLIENT_ID` — from [SeatGeek Developer](https://platform.seatgeek.com/)
   - `SEATGEEK_CLIENT_SECRET` — from SeatGeek Developer
   - `TICKETMASTER_API_KEY` — from [Ticketmaster Developer](https://developer.ticketmaster.com/)
3. Run `npm install`
4. Run `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

Next.js 16, TypeScript, Tailwind CSS, Jest + React Testing Library
