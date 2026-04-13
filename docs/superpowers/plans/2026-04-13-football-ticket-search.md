# Football Ticket Search Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js website where users search for football match tickets, see results from official club sites + SeatGeek + Ticketmaster, save searches, and receive browser push notifications on price changes.

**Architecture:** Next.js 14 App Router with TypeScript and Tailwind CSS. A `/api/search` route fetches official club pages, SeatGeek API, and Ticketmaster API in parallel, normalizes results into a unified `Ticket[]`, and returns them to the frontend. Saved searches live in `localStorage`; a `setInterval` re-checks every 30 minutes and triggers Web Push notifications on price changes.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, SeatGeek API, Ticketmaster API, Web Push API, Jest + React Testing Library, Playwright (E2E)

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`, `.env.local.example`

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd /Users/gorriti/projects/TelmoProject
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

Expected: Next.js project created with `src/app/`, TypeScript, Tailwind.

- [ ] **Step 2: Install additional dependencies**

```bash
npm install cheerio
npm install --save-dev @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom @types/jest ts-jest @playwright/test
```

- [ ] **Step 3: Configure Jest**

Create `jest.config.ts`:
```ts
import type { Config } from 'jest';
const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }] },
};
export default config;
```

Create `jest.setup.ts`:
```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 4: Create `.env.local.example`**

```bash
cat > .env.local.example << 'EOF'
SEATGEEK_CLIENT_ID=your_seatgeek_client_id
SEATGEEK_CLIENT_SECRET=your_seatgeek_client_secret
TICKETMASTER_API_KEY=your_ticketmaster_api_key
EOF
cp .env.local.example .env.local
```

- [ ] **Step 5: Initialize git and commit**

```bash
git init
echo ".env.local" >> .gitignore
git add .
git commit -m "chore: scaffold Next.js project with TypeScript and Tailwind"
```

---

## Task 2: Types

**Files:**
- Create: `src/types/ticket.ts`
- Create: `src/types/savedSearch.ts`

- [ ] **Step 1: Write failing test**

Create `src/types/__tests__/ticket.test.ts`:
```ts
import type { Ticket, SavedSearch } from '@/types/ticket';

describe('Ticket type', () => {
  it('accepts a valid ticket object', () => {
    const ticket: Ticket = {
      price: 89,
      currency: 'EUR',
      section: 'North Stand',
      source: 'SeatGeek',
      sourceLogoUrl: 'https://seatgeek.com/logo.png',
      url: 'https://seatgeek.com/event/123',
      isOfficial: false,
    };
    expect(ticket.price).toBe(89);
    expect(ticket.isOfficial).toBe(false);
  });

  it('accepts a ticket with optional row', () => {
    const ticket: Ticket = {
      price: 150,
      currency: 'EUR',
      section: 'VIP',
      row: 'A',
      source: 'FC Barcelona Official',
      sourceLogoUrl: 'https://fcbarcelona.com/logo.png',
      url: 'https://fcbarcelona.com/tickets',
      isOfficial: true,
    };
    expect(ticket.row).toBe('A');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx jest src/types/__tests__/ticket.test.ts --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create types**

Create `src/types/ticket.ts`:
```ts
export interface Ticket {
  price: number;
  currency: string;
  section: string;
  row?: string;
  source: string;
  sourceLogoUrl: string;
  url: string;
  isOfficial: boolean;
}

export interface DeepLink {
  name: string;
  url: string;
  logoUrl: string;
}

export interface SearchResult {
  tickets: Ticket[];
  deepLinks: DeepLink[];
  query: string;
  fetchedAt: string;
}

export interface SavedSearch {
  id: string;
  query: string;
  savedAt: string;
  lastCheckedAt: string;
  lastCheapestPrice: number | null;
  lastCheapestSource: string | null;
  lastResult: SearchResult | null;
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx jest src/types/__tests__/ticket.test.ts --no-coverage
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types/
git commit -m "feat: add Ticket, SearchResult, SavedSearch types"
```

---

## Task 3: Club Config

**Files:**
- Create: `src/config/clubs.ts`

- [ ] **Step 1: Write failing test**

Create `src/config/__tests__/clubs.test.ts`:
```ts
import { findClubsInQuery, CLUBS } from '@/config/clubs';

describe('findClubsInQuery', () => {
  it('finds Barcelona in query', () => {
    const result = findClubsInQuery('barcelona fc vs real madrid');
    expect(result.map(c => c.name)).toContain('FC Barcelona');
  });

  it('finds Real Madrid in query', () => {
    const result = findClubsInQuery('barcelona fc vs real madrid');
    expect(result.map(c => c.name)).toContain('Real Madrid');
  });

  it('returns empty array for unknown clubs', () => {
    const result = findClubsInQuery('unknown team vs another team');
    expect(result).toHaveLength(0);
  });

  it('is case-insensitive', () => {
    const result = findClubsInQuery('LIVERPOOL vs ARSENAL');
    expect(result.map(c => c.name)).toContain('Liverpool FC');
    expect(result.map(c => c.name)).toContain('Arsenal FC');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx jest src/config/__tests__/clubs.test.ts --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create club config**

Create `src/config/clubs.ts`:
```ts
export interface Club {
  name: string;
  aliases: string[];
  ticketUrl: string;
  logoUrl: string;
}

export const CLUBS: Club[] = [
  {
    name: 'FC Barcelona',
    aliases: ['barcelona', 'barca', 'fcb', 'fc barcelona'],
    ticketUrl: 'https://www.fcbarcelona.com/en/tickets',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
  },
  {
    name: 'Real Madrid',
    aliases: ['real madrid', 'madrid', 'rmcf'],
    ticketUrl: 'https://www.realmadrid.com/en/tickets',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
  },
  {
    name: 'Manchester United',
    aliases: ['manchester united', 'man utd', 'man united', 'mufc'],
    ticketUrl: 'https://www.manutd.com/en/tickets',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
  },
  {
    name: 'Manchester City',
    aliases: ['manchester city', 'man city', 'mcfc'],
    ticketUrl: 'https://www.mancity.com/tickets',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
  },
  {
    name: 'Liverpool FC',
    aliases: ['liverpool', 'lfc'],
    ticketUrl: 'https://www.liverpoolfc.com/tickets',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
  },
  {
    name: 'Arsenal FC',
    aliases: ['arsenal', 'afc', 'the gunners'],
    ticketUrl: 'https://www.arsenal.com/tickets',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
  },
  {
    name: 'Chelsea FC',
    aliases: ['chelsea', 'cfc', 'the blues'],
    ticketUrl: 'https://www.chelseafc.com/en/tickets',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
  },
  {
    name: 'Juventus',
    aliases: ['juventus', 'juve'],
    ticketUrl: 'https://www.juventus.com/en/tickets',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Juventus_FC_2017_icon_%28black%29.svg',
  },
  {
    name: 'AC Milan',
    aliases: ['ac milan', 'milan', 'acm'],
    ticketUrl: 'https://www.acmilan.com/en/tickets',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg',
  },
  {
    name: 'Bayern Munich',
    aliases: ['bayern', 'bayern munich', 'fcb munich', 'fc bayern'],
    ticketUrl: 'https://fcbayern.com/en/tickets',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
  },
  {
    name: 'Paris Saint-Germain',
    aliases: ['psg', 'paris saint-germain', 'paris sg'],
    ticketUrl: 'https://www.psg.fr/en/tickets',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
  },
  {
    name: 'Atletico Madrid',
    aliases: ['atletico', 'atletico madrid', 'atm'],
    ticketUrl: 'https://www.atleticodemadrid.com/entradas',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg',
  },
];

export function findClubsInQuery(query: string): Club[] {
  const lower = query.toLowerCase();
  return CLUBS.filter(club =>
    club.aliases.some(alias => lower.includes(alias))
  );
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx jest src/config/__tests__/clubs.test.ts --no-coverage
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/config/
git commit -m "feat: add club config with alias matching"
```

---

## Task 4: Deep Links Library

**Files:**
- Create: `src/lib/deepLinks.ts`

- [ ] **Step 1: Write failing test**

Create `src/lib/__tests__/deepLinks.test.ts`:
```ts
import { generateDeepLinks } from '@/lib/deepLinks';

describe('generateDeepLinks', () => {
  it('generates deep links for all marketplaces', () => {
    const links = generateDeepLinks('barcelona vs real madrid');
    expect(links).toHaveLength(4);
    expect(links.map(l => l.name)).toEqual([
      'Viagogo', 'StubHub', 'LiveFootballTickets', 'Football Ticket Net'
    ]);
  });

  it('encodes query in URLs', () => {
    const links = generateDeepLinks('barcelona vs real madrid');
    const viagogo = links.find(l => l.name === 'Viagogo');
    expect(viagogo?.url).toContain('barcelona');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx jest src/lib/__tests__/deepLinks.test.ts --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement deepLinks**

Create `src/lib/deepLinks.ts`:
```ts
import type { DeepLink } from '@/types/ticket';

export function generateDeepLinks(query: string): DeepLink[] {
  const encoded = encodeURIComponent(query);
  return [
    {
      name: 'Viagogo',
      url: `https://www.viagogo.com/Concert-Tickets/Sports/Football?q=${encoded}`,
      logoUrl: 'https://www.viagogo.com/favicon.ico',
    },
    {
      name: 'StubHub',
      url: `https://www.stubhub.com/find/s/?q=${encoded}`,
      logoUrl: 'https://www.stubhub.com/favicon.ico',
    },
    {
      name: 'LiveFootballTickets',
      url: `https://www.livefootballtickets.com/search-results.aspx?search=${encoded}`,
      logoUrl: 'https://www.livefootballtickets.com/favicon.ico',
    },
    {
      name: 'Football Ticket Net',
      url: `https://www.football-ticket.net/search?q=${encoded}`,
      logoUrl: 'https://www.football-ticket.net/favicon.ico',
    },
  ];
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx jest src/lib/__tests__/deepLinks.test.ts --no-coverage
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/deepLinks.ts src/lib/__tests__/deepLinks.test.ts
git commit -m "feat: add deep link generator for ticket marketplaces"
```

---

## Task 5: Normalize Tickets Library

**Files:**
- Create: `src/lib/normalizeTickets.ts`

- [ ] **Step 1: Write failing test**

Create `src/lib/__tests__/normalizeTickets.test.ts`:
```ts
import { normalizeSeatGeekEvent, normalizeTicketmasterEvent } from '@/lib/normalizeTickets';
import type { Ticket } from '@/types/ticket';

describe('normalizeSeatGeekEvent', () => {
  it('converts a SeatGeek event to Ticket[]', () => {
    const sgEvent = {
      stats: { lowest_price: 75, highest_price: 400 },
      listings: [
        { price: 75, section: 'GA', row: null },
        { price: 400, section: 'VIP Lounge', row: 'A' },
      ],
      url: 'https://seatgeek.com/event/123',
    };
    const tickets = normalizeSeatGeekEvent(sgEvent);
    expect(tickets).toHaveLength(2);
    expect(tickets[0]).toMatchObject<Partial<Ticket>>({
      price: 75,
      section: 'GA',
      source: 'SeatGeek',
      isOfficial: false,
      currency: 'USD',
    });
    expect(tickets[1].row).toBe('A');
  });
});

describe('normalizeTicketmasterEvent', () => {
  it('converts a Ticketmaster event to Ticket[]', () => {
    const tmEvent = {
      priceRanges: [{ min: 60, max: 300, currency: 'EUR' }],
      _embedded: {
        venues: [{ name: 'Camp Nou' }],
      },
      url: 'https://ticketmaster.com/event/abc',
      images: [{ url: 'https://ticketmaster.com/img.png' }],
      seatmap: { staticUrl: '' },
      priceRangeEntries: [
        { price: 60, section: 'Block 101', row: '5', currency: 'EUR' },
      ],
    };
    const tickets = normalizeTicketmasterEvent(tmEvent);
    expect(tickets[0]).toMatchObject<Partial<Ticket>>({
      price: 60,
      section: 'Block 101',
      source: 'Ticketmaster',
      isOfficial: false,
      currency: 'EUR',
    });
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx jest src/lib/__tests__/normalizeTickets.test.ts --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement normalizeTickets**

Create `src/lib/normalizeTickets.ts`:
```ts
import type { Ticket } from '@/types/ticket';

const SEATGEEK_LOGO = 'https://seatgeek.com/images/favicons/favicon-32x32.png';
const TICKETMASTER_LOGO = 'https://www.ticketmaster.com/favicon.ico';

export function normalizeSeatGeekEvent(event: {
  listings?: Array<{ price: number; section: string; row?: string | null }>;
  stats?: { lowest_price: number; highest_price: number };
  url: string;
}): Ticket[] {
  if (!event.listings || event.listings.length === 0) {
    if (!event.stats) return [];
    return [
      {
        price: event.stats.lowest_price,
        currency: 'USD',
        section: 'General Admission',
        source: 'SeatGeek',
        sourceLogoUrl: SEATGEEK_LOGO,
        url: event.url,
        isOfficial: false,
      },
    ];
  }
  return event.listings.map(listing => ({
    price: listing.price,
    currency: 'USD',
    section: listing.section || 'General Admission',
    row: listing.row ?? undefined,
    source: 'SeatGeek',
    sourceLogoUrl: SEATGEEK_LOGO,
    url: event.url,
    isOfficial: false,
  }));
}

export function normalizeTicketmasterEvent(event: {
  priceRangeEntries?: Array<{ price: number; section: string; row?: string; currency: string }>;
  priceRanges?: Array<{ min: number; max: number; currency: string }>;
  url: string;
}): Ticket[] {
  if (event.priceRangeEntries && event.priceRangeEntries.length > 0) {
    return event.priceRangeEntries.map(entry => ({
      price: entry.price,
      currency: entry.currency,
      section: entry.section || 'General Admission',
      row: entry.row,
      source: 'Ticketmaster',
      sourceLogoUrl: TICKETMASTER_LOGO,
      url: event.url,
      isOfficial: false,
    }));
  }
  if (!event.priceRanges || event.priceRanges.length === 0) return [];
  const range = event.priceRanges[0];
  return [
    {
      price: range.min,
      currency: range.currency,
      section: 'General Admission',
      source: 'Ticketmaster',
      sourceLogoUrl: TICKETMASTER_LOGO,
      url: event.url,
      isOfficial: false,
    },
  ];
}

export function normalizeOfficialClubTicket(
  clubName: string,
  clubLogoUrl: string,
  ticketUrl: string,
  price: number,
  currency: string,
  section: string
): Ticket {
  return {
    price,
    currency,
    section,
    source: `${clubName} Official`,
    sourceLogoUrl: clubLogoUrl,
    url: ticketUrl,
    isOfficial: true,
  };
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx jest src/lib/__tests__/normalizeTickets.test.ts --no-coverage
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/normalizeTickets.ts src/lib/__tests__/normalizeTickets.test.ts
git commit -m "feat: add ticket normalization for SeatGeek and Ticketmaster"
```

---

## Task 6: SeatGeek API Client

**Files:**
- Create: `src/lib/seatgeek.ts`

- [ ] **Step 1: Write failing test**

Create `src/lib/__tests__/seatgeek.test.ts`:
```ts
import { searchSeatGeek } from '@/lib/seatgeek';

global.fetch = jest.fn();

describe('searchSeatGeek', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns empty array when no events found', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ events: [] }),
    });
    const result = await searchSeatGeek('no match here', 'fake-id', 'fake-secret');
    expect(result).toEqual([]);
  });

  it('returns tickets when events found', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        events: [
          {
            stats: { lowest_price: 80, highest_price: 300 },
            listings: [],
            url: 'https://seatgeek.com/event/1',
          },
        ],
      }),
    });
    const result = await searchSeatGeek('barcelona vs madrid', 'id', 'secret');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].source).toBe('SeatGeek');
  });

  it('returns empty array on API error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });
    const result = await searchSeatGeek('barcelona vs madrid', 'id', 'secret');
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx jest src/lib/__tests__/seatgeek.test.ts --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement SeatGeek client**

Create `src/lib/seatgeek.ts`:
```ts
import type { Ticket } from '@/types/ticket';
import { normalizeSeatGeekEvent } from '@/lib/normalizeTickets';

export async function searchSeatGeek(
  query: string,
  clientId: string,
  clientSecret: string
): Promise<Ticket[]> {
  const params = new URLSearchParams({
    q: query,
    type: 'sports',
    client_id: clientId,
    client_secret: clientSecret,
    per_page: '20',
  });

  let response: Response;
  try {
    response = await fetch(`https://api.seatgeek.com/2/events?${params}`);
  } catch {
    console.error('[SeatGeek] Network error for query:', query);
    return [];
  }

  if (!response.ok) {
    console.error('[SeatGeek] API error:', response.status);
    return [];
  }

  const data = await response.json();
  if (!data.events || data.events.length === 0) return [];

  return data.events.flatMap((event: unknown) =>
    normalizeSeatGeekEvent(event as Parameters<typeof normalizeSeatGeekEvent>[0])
  );
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx jest src/lib/__tests__/seatgeek.test.ts --no-coverage
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/seatgeek.ts src/lib/__tests__/seatgeek.test.ts
git commit -m "feat: add SeatGeek API client"
```

---

## Task 7: Ticketmaster API Client

**Files:**
- Create: `src/lib/ticketmaster.ts`

- [ ] **Step 1: Write failing test**

Create `src/lib/__tests__/ticketmaster.test.ts`:
```ts
import { searchTicketmaster } from '@/lib/ticketmaster';

global.fetch = jest.fn();

describe('searchTicketmaster', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns empty array when no events found', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ _embedded: { events: [] } }),
    });
    const result = await searchTicketmaster('no match', 'fake-key');
    expect(result).toEqual([]);
  });

  it('returns tickets when events found', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        _embedded: {
          events: [
            {
              priceRanges: [{ min: 60, max: 300, currency: 'EUR' }],
              priceRangeEntries: [],
              url: 'https://ticketmaster.com/event/1',
            },
          ],
        },
      }),
    });
    const result = await searchTicketmaster('barcelona vs madrid', 'key');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].source).toBe('Ticketmaster');
  });

  it('returns empty array on API error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 401 });
    const result = await searchTicketmaster('barcelona vs madrid', 'key');
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx jest src/lib/__tests__/ticketmaster.test.ts --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement Ticketmaster client**

Create `src/lib/ticketmaster.ts`:
```ts
import type { Ticket } from '@/types/ticket';
import { normalizeTicketmasterEvent } from '@/lib/normalizeTickets';

export async function searchTicketmaster(
  query: string,
  apiKey: string
): Promise<Ticket[]> {
  const params = new URLSearchParams({
    keyword: query,
    classificationName: 'sports',
    apikey: apiKey,
    size: '20',
  });

  let response: Response;
  try {
    response = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?${params}`
    );
  } catch {
    console.error('[Ticketmaster] Network error for query:', query);
    return [];
  }

  if (!response.ok) {
    console.error('[Ticketmaster] API error:', response.status);
    return [];
  }

  const data = await response.json();
  const events = data?._embedded?.events ?? [];
  if (events.length === 0) return [];

  return events.flatMap((event: unknown) =>
    normalizeTicketmasterEvent(event as Parameters<typeof normalizeTicketmasterEvent>[0])
  );
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx jest src/lib/__tests__/ticketmaster.test.ts --no-coverage
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ticketmaster.ts src/lib/__tests__/ticketmaster.test.ts
git commit -m "feat: add Ticketmaster API client"
```

---

## Task 8: Club Scraper

**Files:**
- Create: `src/lib/clubScraper.ts`

- [ ] **Step 1: Write failing test**

Create `src/lib/__tests__/clubScraper.test.ts`:
```ts
import { checkClubTickets } from '@/lib/clubScraper';
import type { Club } from '@/config/clubs';

global.fetch = jest.fn();

const mockClub: Club = {
  name: 'FC Barcelona',
  aliases: ['barcelona'],
  ticketUrl: 'https://www.fcbarcelona.com/en/tickets',
  logoUrl: 'https://example.com/barca.svg',
};

describe('checkClubTickets', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns empty array when fetch fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    const result = await checkClubTickets(mockClub, 'barcelona vs madrid');
    expect(result).toEqual([]);
  });

  it('returns empty array when response is not ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 403 });
    const result = await checkClubTickets(mockClub, 'barcelona vs madrid');
    expect(result).toEqual([]);
  });

  it('returns a ticket pointing to club URL when page fetched successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => '<html><body>Tickets available from €65</body></html>',
    });
    const result = await checkClubTickets(mockClub, 'barcelona vs madrid');
    expect(result[0]).toMatchObject({
      source: 'FC Barcelona Official',
      isOfficial: true,
      url: 'https://www.fcbarcelona.com/en/tickets',
    });
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx jest src/lib/__tests__/clubScraper.test.ts --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement club scraper**

Create `src/lib/clubScraper.ts`:
```ts
import type { Ticket } from '@/types/ticket';
import type { Club } from '@/config/clubs';
import { normalizeOfficialClubTicket } from '@/lib/normalizeTickets';

const PRICE_PATTERN = /(?:from\s+)?[€$£]?\s*(\d+(?:[.,]\d{1,2})?)\s*(?:EUR|USD|GBP)?/i;

export async function checkClubTickets(
  club: Club,
  _query: string
): Promise<Ticket[]> {
  let response: Response;
  try {
    response = await fetch(club.ticketUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TicketSearchBot/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    console.error(`[ClubScraper] Failed to fetch ${club.ticketUrl}`);
    return [];
  }

  if (!response.ok) {
    console.error(`[ClubScraper] ${club.name} returned ${response.status}`);
    return [];
  }

  const html = await response.text();
  const priceMatch = html.match(PRICE_PATTERN);
  const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0;
  const currency = html.includes('£') ? 'GBP' : html.includes('$') ? 'USD' : 'EUR';

  return [
    normalizeOfficialClubTicket(
      club.name,
      club.logoUrl,
      club.ticketUrl,
      price,
      currency,
      'Official Club Allocation'
    ),
  ];
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx jest src/lib/__tests__/clubScraper.test.ts --no-coverage
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/clubScraper.ts src/lib/__tests__/clubScraper.test.ts
git commit -m "feat: add official club ticket page scraper"
```

---

## Task 9: Search API Route

**Files:**
- Create: `src/app/api/search/route.ts`

- [ ] **Step 1: Write failing test**

Create `src/app/api/search/__tests__/route.test.ts`:
```ts
import { GET } from '@/app/api/search/route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/seatgeek', () => ({
  searchSeatGeek: jest.fn().mockResolvedValue([
    {
      price: 80,
      currency: 'USD',
      section: 'GA',
      source: 'SeatGeek',
      sourceLogoUrl: 'https://seatgeek.com/logo.png',
      url: 'https://seatgeek.com/event/1',
      isOfficial: false,
    },
  ]),
}));

jest.mock('@/lib/ticketmaster', () => ({
  searchTicketmaster: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/lib/clubScraper', () => ({
  checkClubTickets: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/config/clubs', () => ({
  findClubsInQuery: jest.fn().mockReturnValue([]),
  CLUBS: [],
}));

describe('GET /api/search', () => {
  it('returns 400 when query is missing', async () => {
    const req = new NextRequest('http://localhost/api/search');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns SearchResult with tickets and deepLinks', async () => {
    const req = new NextRequest('http://localhost/api/search?q=barcelona+vs+madrid');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('tickets');
    expect(body).toHaveProperty('deepLinks');
    expect(body).toHaveProperty('query', 'barcelona vs madrid');
    expect(body.tickets[0].source).toBe('SeatGeek');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx jest src/app/api/search/__tests__/route.test.ts --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement search API route**

Create `src/app/api/search/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server';
import type { SearchResult, Ticket } from '@/types/ticket';
import { searchSeatGeek } from '@/lib/seatgeek';
import { searchTicketmaster } from '@/lib/ticketmaster';
import { checkClubTickets } from '@/lib/clubScraper';
import { generateDeepLinks } from '@/lib/deepLinks';
import { findClubsInQuery } from '@/config/clubs';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const query = request.nextUrl.searchParams.get('q');
  if (!query || query.trim().length === 0) {
    return NextResponse.json({ error: 'Query parameter q is required' }, { status: 400 });
  }

  const normalizedQuery = query.trim().toLowerCase();
  const clubs = findClubsInQuery(normalizedQuery);

  const [clubTicketsArrays, seatGeekTickets, ticketmasterTickets] = await Promise.all([
    Promise.all(clubs.map(club => checkClubTickets(club, normalizedQuery))),
    searchSeatGeek(
      normalizedQuery,
      process.env.SEATGEEK_CLIENT_ID ?? '',
      process.env.SEATGEEK_CLIENT_SECRET ?? ''
    ),
    searchTicketmaster(normalizedQuery, process.env.TICKETMASTER_API_KEY ?? ''),
  ]);

  const officialTickets = clubTicketsArrays.flat();
  const allTickets: Ticket[] = [
    ...officialTickets,
    ...seatGeekTickets,
    ...ticketmasterTickets,
  ].sort((a, b) => a.price - b.price);

  const result: SearchResult = {
    tickets: allTickets,
    deepLinks: generateDeepLinks(query),
    query,
    fetchedAt: new Date().toISOString(),
  };

  return NextResponse.json(result);
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx jest src/app/api/search/__tests__/route.test.ts --no-coverage
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/search/
git commit -m "feat: add /api/search route with parallel fetching"
```

---

## Task 10: useSavedSearches Hook

**Files:**
- Create: `src/hooks/useSavedSearches.ts`

- [ ] **Step 1: Write failing test**

Create `src/hooks/__tests__/useSavedSearches.test.ts`:
```ts
import { renderHook, act } from '@testing-library/react';
import { useSavedSearches } from '@/hooks/useSavedSearches';

const mockResult = {
  tickets: [],
  deepLinks: [],
  query: 'barcelona vs madrid',
  fetchedAt: new Date().toISOString(),
};

describe('useSavedSearches', () => {
  beforeEach(() => localStorage.clear());

  it('starts with empty saved searches', () => {
    const { result } = renderHook(() => useSavedSearches());
    expect(result.current.savedSearches).toHaveLength(0);
  });

  it('saves a search', () => {
    const { result } = renderHook(() => useSavedSearches());
    act(() => {
      result.current.saveSearch('barcelona vs madrid', mockResult);
    });
    expect(result.current.savedSearches).toHaveLength(1);
    expect(result.current.savedSearches[0].query).toBe('barcelona vs madrid');
  });

  it('removes a search', () => {
    const { result } = renderHook(() => useSavedSearches());
    act(() => {
      result.current.saveSearch('barcelona vs madrid', mockResult);
    });
    const id = result.current.savedSearches[0].id;
    act(() => {
      result.current.removeSearch(id);
    });
    expect(result.current.savedSearches).toHaveLength(0);
  });

  it('checks if a query is already saved', () => {
    const { result } = renderHook(() => useSavedSearches());
    act(() => {
      result.current.saveSearch('barcelona vs madrid', mockResult);
    });
    expect(result.current.isSaved('barcelona vs madrid')).toBe(true);
    expect(result.current.isSaved('psg vs lyon')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx jest src/hooks/__tests__/useSavedSearches.test.ts --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement useSavedSearches**

Create `src/hooks/useSavedSearches.ts`:
```ts
'use client';
import { useState, useEffect, useCallback } from 'react';
import type { SavedSearch, SearchResult } from '@/types/ticket';

const STORAGE_KEY = 'football-ticket-saved-searches';

function loadFromStorage(): SavedSearch[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedSearch[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage(searches: SavedSearch[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
}

export function useSavedSearches() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  useEffect(() => {
    setSavedSearches(loadFromStorage());
  }, []);

  const saveSearch = useCallback((query: string, result: SearchResult) => {
    const cheapestTicket = result.tickets[0] ?? null;
    const entry: SavedSearch = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      query,
      savedAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
      lastCheapestPrice: cheapestTicket?.price ?? null,
      lastCheapestSource: cheapestTicket?.source ?? null,
      lastResult: result,
    };
    setSavedSearches(prev => {
      const updated = [...prev, entry];
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const removeSearch = useCallback((id: string) => {
    setSavedSearches(prev => {
      const updated = prev.filter(s => s.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const updateSearch = useCallback((id: string, result: SearchResult) => {
    const cheapestTicket = result.tickets[0] ?? null;
    setSavedSearches(prev => {
      const updated = prev.map(s =>
        s.id === id
          ? {
              ...s,
              lastCheckedAt: new Date().toISOString(),
              lastCheapestPrice: cheapestTicket?.price ?? null,
              lastCheapestSource: cheapestTicket?.source ?? null,
              lastResult: result,
            }
          : s
      );
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const isSaved = useCallback(
    (query: string) => savedSearches.some(s => s.query === query),
    [savedSearches]
  );

  return { savedSearches, saveSearch, removeSearch, updateSearch, isSaved };
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx jest src/hooks/__tests__/useSavedSearches.test.ts --no-coverage
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useSavedSearches.ts src/hooks/__tests__/useSavedSearches.test.ts
git commit -m "feat: add useSavedSearches hook with localStorage persistence"
```

---

## Task 11: useNotifications Hook

**Files:**
- Create: `src/hooks/useNotifications.ts`

- [ ] **Step 1: Write failing test**

Create `src/hooks/__tests__/useNotifications.test.ts`:
```ts
import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '@/hooks/useNotifications';

const mockNotification = {
  permission: 'default' as NotificationPermission,
  requestPermission: jest.fn().mockResolvedValue('granted'),
};

Object.defineProperty(global, 'Notification', {
  value: mockNotification,
  writable: true,
});

describe('useNotifications', () => {
  it('starts with permission as default', () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current.permission).toBe('default');
  });

  it('requestPermission calls Notification.requestPermission', async () => {
    const { result } = renderHook(() => useNotifications());
    await act(async () => {
      await result.current.requestPermission();
    });
    expect(mockNotification.requestPermission).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx jest src/hooks/__tests__/useNotifications.test.ts --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement useNotifications**

Create `src/hooks/useNotifications.ts`:
```ts
'use client';
import { useState, useCallback } from 'react';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }, []);

  const sendNotification = useCallback(
    (title: string, body: string) => {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      new Notification(title, { body, icon: '/favicon.ico' });
    },
    []
  );

  return { permission, requestPermission, sendNotification };
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx jest src/hooks/__tests__/useNotifications.test.ts --no-coverage
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useNotifications.ts src/hooks/__tests__/useNotifications.test.ts
git commit -m "feat: add useNotifications hook for Web Push API"
```

---

## Task 12: UI Components

**Files:**
- Create: `src/components/Toast.tsx`
- Create: `src/components/StadiumLocationBadge.tsx`
- Create: `src/components/PriceSummaryCard.tsx`
- Create: `src/components/OfficialTicketsBanner.tsx`
- Create: `src/components/TicketCard.tsx`
- Create: `src/components/TicketList.tsx`
- Create: `src/components/SourceLinksPanel.tsx`
- Create: `src/components/SaveSearchButton.tsx`
- Create: `src/components/SavedSearchesPanel.tsx`
- Create: `src/components/SearchBar.tsx`

- [ ] **Step 1: Write failing component tests**

Create `src/components/__tests__/components.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Toast } from '@/components/Toast';
import { StadiumLocationBadge } from '@/components/StadiumLocationBadge';
import { PriceSummaryCard } from '@/components/PriceSummaryCard';
import { TicketCard } from '@/components/TicketCard';
import { SearchBar } from '@/components/SearchBar';
import type { Ticket } from '@/types/ticket';

const mockTicket: Ticket = {
  price: 89,
  currency: 'EUR',
  section: 'North Stand',
  source: 'SeatGeek',
  sourceLogoUrl: 'https://seatgeek.com/logo.png',
  url: 'https://seatgeek.com/event/1',
  isOfficial: false,
};

describe('Toast', () => {
  it('renders message', () => {
    render(<Toast message="Search complete!" visible onClose={() => {}} />);
    expect(screen.getByText('Search complete!')).toBeInTheDocument();
  });
  it('is hidden when visible is false', () => {
    const { container } = render(
      <Toast message="Hidden" visible={false} onClose={() => {}} />
    );
    expect(container.firstChild).toHaveClass('opacity-0');
  });
});

describe('StadiumLocationBadge', () => {
  it('renders section name', () => {
    render(<StadiumLocationBadge section="North Stand" />);
    expect(screen.getByText('North Stand')).toBeInTheDocument();
  });
});

describe('PriceSummaryCard', () => {
  it('shows cheapest and most expensive prices', () => {
    render(
      <PriceSummaryCard
        cheapest={mockTicket}
        mostExpensive={{ ...mockTicket, price: 500 }}
      />
    );
    expect(screen.getByText(/89/)).toBeInTheDocument();
    expect(screen.getByText(/500/)).toBeInTheDocument();
  });
});

describe('TicketCard', () => {
  it('renders ticket info', () => {
    render(<TicketCard ticket={mockTicket} />);
    expect(screen.getByText('North Stand')).toBeInTheDocument();
    expect(screen.getByText('SeatGeek')).toBeInTheDocument();
  });
  it('shows Official badge for official tickets', () => {
    render(<TicketCard ticket={{ ...mockTicket, isOfficial: true }} />);
    expect(screen.getByText('Official')).toBeInTheDocument();
  });
});

describe('SearchBar', () => {
  it('calls onSearch with query on submit', () => {
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} loading={false} />);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'barcelona vs madrid' },
    });
    fireEvent.submit(screen.getByRole('form'));
    expect(onSearch).toHaveBeenCalledWith('barcelona vs madrid');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx jest src/components/__tests__/components.test.tsx --no-coverage
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Create Toast component**

Create `src/components/Toast.tsx`:
```tsx
'use client';
interface ToastProps {
  message: string;
  visible: boolean;
  onClose: () => void;
}
export function Toast({ message, visible, onClose }: ToastProps) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg bg-gray-900 px-5 py-3 text-white shadow-lg transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <span className="text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-white text-lg leading-none">&times;</button>
    </div>
  );
}
```

- [ ] **Step 4: Create StadiumLocationBadge component**

Create `src/components/StadiumLocationBadge.tsx`:
```tsx
interface StadiumLocationBadgeProps {
  section: string;
}
export function StadiumLocationBadge({ section }: StadiumLocationBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
      {section}
    </span>
  );
}
```

- [ ] **Step 5: Create PriceSummaryCard component**

Create `src/components/PriceSummaryCard.tsx`:
```tsx
import type { Ticket } from '@/types/ticket';

interface PriceSummaryCardProps {
  cheapest: Ticket;
  mostExpensive: Ticket;
}
export function PriceSummaryCard({ cheapest, mostExpensive }: PriceSummaryCardProps) {
  return (
    <div className="grid grid-cols-2 gap-4 rounded-xl bg-white p-6 shadow-md">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-green-600">Cheapest</p>
        <p className="mt-1 text-3xl font-bold text-gray-900">
          {cheapest.currency === 'USD' ? '$' : cheapest.currency === 'GBP' ? '£' : '€'}
          {cheapest.price}
        </p>
        <a href={cheapest.url} target="_blank" rel="noopener noreferrer"
          className="mt-1 text-sm text-blue-600 hover:underline">
          {cheapest.source}
        </a>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Most Expensive</p>
        <p className="mt-1 text-3xl font-bold text-gray-900">
          {mostExpensive.currency === 'USD' ? '$' : mostExpensive.currency === 'GBP' ? '£' : '€'}
          {mostExpensive.price}
        </p>
        <a href={mostExpensive.url} target="_blank" rel="noopener noreferrer"
          className="mt-1 text-sm text-blue-600 hover:underline">
          {mostExpensive.source}
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create TicketCard component**

Create `src/components/TicketCard.tsx`:
```tsx
import type { Ticket } from '@/types/ticket';
import { StadiumLocationBadge } from '@/components/StadiumLocationBadge';

interface TicketCardProps {
  ticket: Ticket;
}
export function TicketCard({ ticket }: TicketCardProps) {
  const symbol = ticket.currency === 'USD' ? '$' : ticket.currency === 'GBP' ? '£' : '€';
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-gray-900">{symbol}{ticket.price}</span>
          {ticket.isOfficial && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Official</span>
          )}
        </div>
        <StadiumLocationBadge section={ticket.section} />
        {ticket.row && <span className="text-xs text-gray-500">Row {ticket.row}</span>}
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <img src={ticket.sourceLogoUrl} alt={ticket.source} className="h-5 w-5 rounded" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <span className="text-sm text-gray-600">{ticket.source}</span>
        </div>
        <a href={ticket.url} target="_blank" rel="noopener noreferrer"
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
          Buy
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Create TicketList component**

Create `src/components/TicketList.tsx`:
```tsx
import type { Ticket } from '@/types/ticket';
import { TicketCard } from '@/components/TicketCard';

interface TicketListProps {
  tickets: Ticket[];
}
export function TicketList({ tickets }: TicketListProps) {
  if (tickets.length === 0) {
    return <p className="text-center text-gray-500 py-8">No tickets found for this match.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      {tickets.map((ticket, i) => (
        <TicketCard key={`${ticket.source}-${ticket.price}-${i}`} ticket={ticket} />
      ))}
    </div>
  );
}
```

- [ ] **Step 8: Create OfficialTicketsBanner component**

Create `src/components/OfficialTicketsBanner.tsx`:
```tsx
import type { Ticket } from '@/types/ticket';
import { TicketCard } from '@/components/TicketCard';

interface OfficialTicketsBannerProps {
  tickets: Ticket[];
}
export function OfficialTicketsBanner({ tickets }: OfficialTicketsBannerProps) {
  if (tickets.length === 0) return null;
  return (
    <div className="rounded-xl border-2 border-green-300 bg-green-50 p-4">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-green-700">
        Official Club Tickets
      </h2>
      <div className="flex flex-col gap-2">
        {tickets.map((ticket, i) => (
          <TicketCard key={`official-${i}`} ticket={ticket} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Create SourceLinksPanel component**

Create `src/components/SourceLinksPanel.tsx`:
```tsx
import type { DeepLink } from '@/types/ticket';

interface SourceLinksPanelProps {
  deepLinks: DeepLink[];
}
export function SourceLinksPanel({ deepLinks }: SourceLinksPanelProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-gray-700">Also search on</h2>
      <div className="flex flex-wrap gap-3">
        {deepLinks.map(link => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <img src={link.logoUrl} alt={link.name} className="h-4 w-4" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            {link.name} &rarr;
          </a>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 10: Create SaveSearchButton component**

Create `src/components/SaveSearchButton.tsx`:
```tsx
'use client';
interface SaveSearchButtonProps {
  isSaved: boolean;
  onSave: () => void;
  onRemove: () => void;
}
export function SaveSearchButton({ isSaved, onSave, onRemove }: SaveSearchButtonProps) {
  return (
    <button
      onClick={isSaved ? onRemove : onSave}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
        isSaved
          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {isSaved ? 'Saved — Remove' : 'Save & Get Alerts'}
    </button>
  );
}
```

- [ ] **Step 11: Create SavedSearchesPanel component**

Create `src/components/SavedSearchesPanel.tsx`:
```tsx
'use client';
import type { SavedSearch } from '@/types/ticket';

interface SavedSearchesPanelProps {
  savedSearches: SavedSearch[];
  onRemove: (id: string) => void;
  onRecheck: (query: string) => void;
}
export function SavedSearchesPanel({ savedSearches, onRemove, onRecheck }: SavedSearchesPanelProps) {
  if (savedSearches.length === 0) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-gray-800">Saved Searches</h2>
      <ul className="flex flex-col gap-3">
        {savedSearches.map(search => (
          <li key={search.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <div>
              <p className="font-medium text-gray-900">{search.query}</p>
              <p className="text-xs text-gray-500">
                Last checked: {new Date(search.lastCheckedAt).toLocaleString()}
                {search.lastCheapestPrice !== null && (
                  <> &bull; From {search.lastCheapestPrice} on {search.lastCheapestSource}</>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onRecheck(search.query)}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Re-check
              </button>
              <button
                onClick={() => onRemove(search.id)}
                className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 12: Create SearchBar component**

Create `src/components/SearchBar.tsx`:
```tsx
'use client';
import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading: boolean;
  initialValue?: string;
}
export function SearchBar({ onSearch, loading, initialValue = '' }: SearchBarProps) {
  const [value, setValue] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length > 0) onSearch(trimmed);
  };

  return (
    <form role="form" onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="e.g. Barcelona FC vs Real Madrid"
        className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        disabled={loading}
        aria-label="Match search"
      />
      <button
        type="submit"
        disabled={loading || value.trim().length === 0}
        className="rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Searching…' : 'Search'}
      </button>
    </form>
  );
}
```

- [ ] **Step 13: Run all component tests — expect PASS**

```bash
npx jest src/components/__tests__/components.test.tsx --no-coverage
```

Expected: PASS.

- [ ] **Step 14: Commit**

```bash
git add src/components/
git commit -m "feat: add all UI components"
```

---

## Task 13: Home Page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace home page**

Replace the contents of `src/app/page.tsx`:
```tsx
'use client';
import { useRouter } from 'next/navigation';
import { SearchBar } from '@/components/SearchBar';
import { SavedSearchesPanel } from '@/components/SavedSearchesPanel';
import { useSavedSearches } from '@/hooks/useSavedSearches';

export default function HomePage() {
  const router = useRouter();
  const { savedSearches, removeSearch } = useSavedSearches();

  const handleSearch = (query: string) => {
    router.push(`/results?q=${encodeURIComponent(query)}`);
  };

  const handleRecheck = (query: string) => {
    router.push(`/results?q=${encodeURIComponent(query)}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="mx-auto max-w-2xl px-4 py-20">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            Football Ticket Search
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            Find the cheapest tickets from official clubs, SeatGeek, Ticketmaster, and more.
          </p>
        </div>
        <SearchBar onSearch={handleSearch} loading={false} />
        <div className="mt-10">
          <SavedSearchesPanel
            savedSearches={savedSearches}
            onRemove={removeSearch}
            onRecheck={handleRecheck}
          />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add home page with search bar and saved searches panel"
```

---

## Task 14: Results Page

**Files:**
- Create: `src/app/results/page.tsx`

- [ ] **Step 1: Create results page**

Create `src/app/results/page.tsx`:
```tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { SearchResult } from '@/types/ticket';
import { PriceSummaryCard } from '@/components/PriceSummaryCard';
import { OfficialTicketsBanner } from '@/components/OfficialTicketsBanner';
import { TicketList } from '@/components/TicketList';
import { SourceLinksPanel } from '@/components/SourceLinksPanel';
import { SaveSearchButton } from '@/components/SaveSearchButton';
import { Toast } from '@/components/Toast';
import { SearchBar } from '@/components/SearchBar';
import { useSavedSearches } from '@/hooks/useSavedSearches';
import { useNotifications } from '@/hooks/useNotifications';

const RECHECK_INTERVAL_MS = 30 * 60 * 1000;

export default function ResultsPage() {
  const params = useSearchParams();
  const query = params.get('q') ?? '';

  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const { savedSearches, saveSearch, removeSearch, updateSearch, isSaved } = useSavedSearches();
  const { permission, requestPermission, sendNotification } = useNotifications();

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 5000);
  };

  const fetchResults = async (q: string): Promise<SearchResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Search failed');
      return await res.json() as SearchResult;
    } catch {
      setError('Something went wrong. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!query) return;
    fetchResults(query).then(data => {
      if (!data) return;
      setResult(data);
      const cheapest = data.tickets[0];
      showToast(
        cheapest
          ? `Search complete! Cheapest: ${cheapest.price} ${cheapest.currency} on ${cheapest.source}`
          : `Search complete! No tickets found.`
      );
      sendNotification('Search complete!', cheapest ? `From ${cheapest.price} ${cheapest.currency} on ${cheapest.source}` : 'No tickets found.');
    });
  }, [query]);

  const savedSearchesRef = useRef(savedSearches);
  savedSearchesRef.current = savedSearches;

  useEffect(() => {
    const interval = setInterval(async () => {
      for (const saved of savedSearchesRef.current) {
        const data = await fetchResults(saved.query);
        if (!data) continue;
        const newCheapest = data.tickets[0];
        const oldPrice = saved.lastCheapestPrice;
        updateSearch(saved.id, data);
        if (newCheapest && (oldPrice === null || newCheapest.price < oldPrice)) {
          showToast(`Price drop! ${saved.query} — now from ${newCheapest.price} on ${newCheapest.source}`);
          sendNotification(
            `Price drop! ${saved.query}`,
            `Now from ${newCheapest.price} ${newCheapest.currency} on ${newCheapest.source}`
          );
        }
      }
    }, RECHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const officialTickets = result?.tickets.filter(t => t.isOfficial) ?? [];
  const allTickets = result?.tickets ?? [];
  const cheapest = allTickets[0] ?? null;
  const mostExpensive = allTickets[allTickets.length - 1] ?? null;

  const handleSave = async () => {
    if (permission !== 'granted') await requestPermission();
    if (result) saveSearch(query, result);
    showToast(`Saved! You'll be notified of price changes.`);
  };

  const handleRemove = () => {
    const saved = savedSearches.find(s => s.query === query);
    if (saved) removeSearch(saved.id);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link href="/" className="mb-6 inline-block text-sm text-blue-600 hover:underline">
          &larr; New search
        </Link>

        <div className="mb-6">
          <SearchBar
            onSearch={q => { window.location.href = `/results?q=${encodeURIComponent(q)}`; }}
            loading={loading}
            initialValue={query}
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <span className="ml-4 text-gray-500">Searching for tickets…</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-red-700">{error}</div>
        )}

        {!loading && result && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">{query}</h1>
              <SaveSearchButton
                isSaved={isSaved(query)}
                onSave={handleSave}
                onRemove={handleRemove}
              />
            </div>

            {cheapest && mostExpensive && (
              <PriceSummaryCard cheapest={cheapest} mostExpensive={mostExpensive} />
            )}

            {officialTickets.length > 0 && (
              <OfficialTicketsBanner tickets={officialTickets} />
            )}

            <TicketList tickets={allTickets} />

            <SourceLinksPanel deepLinks={result.deepLinks} />
          </div>
        )}
      </div>

      <Toast message={toastMessage} visible={toastVisible} onClose={() => setToastVisible(false)} />
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/results/
git commit -m "feat: add results page with tickets, price summary, notifications"
```

---

## Task 15: GitHub Publish

**Files:**
- No code changes — GitHub setup only

- [ ] **Step 1: Verify GitHub CLI is authenticated**

```bash
gh auth status
```

Expected: logged in to github.com.

- [ ] **Step 2: Create GitHub repository**

```bash
gh repo create TelmoProject --public --description "Football ticket search website — finds cheapest tickets from official clubs, SeatGeek, Ticketmaster, and more" --source=. --remote=origin --push
```

Expected: Repository created and code pushed.

- [ ] **Step 3: Get the repository URL**

```bash
gh repo view --web --no-browser 2>/dev/null || gh repo view | grep "https"
```

- [ ] **Step 4: Add README**

Create `README.md`:
```markdown
# Football Ticket Search

Search for football match tickets across official club websites, SeatGeek, Ticketmaster, and more — all in one place.

## Features

- Search any match (e.g. "Barcelona FC vs Real Madrid")
- Official club tickets highlighted first
- Cheapest and most expensive ticket summary
- Direct links to Viagogo, StubHub, LiveFootballTickets, Football Ticket Net
- Save searches and receive browser notifications on price drops

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

Next.js 14, TypeScript, Tailwind CSS
```

```bash
git add README.md
git commit -m "docs: add README with setup instructions"
git push
```

---

## Final Verification

- [ ] Run all tests: `npx jest --no-coverage`
- [ ] Start dev server: `npm run dev`
- [ ] Open http://localhost:3000 and search for "Barcelona vs Real Madrid"
- [ ] Verify results page shows tickets, price summary, official banner, deep links
- [ ] Verify "Save & Get Alerts" button works and saved search appears on home page
- [ ] Verify toast notification appears after search
