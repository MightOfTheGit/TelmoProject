/**
 * @jest-environment node
 */
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
