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
