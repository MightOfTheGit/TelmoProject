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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    response = await fetch(club.ticketUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TicketSearchBot/1.0)' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
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
