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
