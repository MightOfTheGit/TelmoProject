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
