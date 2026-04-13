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
