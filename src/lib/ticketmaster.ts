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
