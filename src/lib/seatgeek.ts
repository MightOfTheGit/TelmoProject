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
