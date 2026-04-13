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
