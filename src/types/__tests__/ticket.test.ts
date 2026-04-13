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
