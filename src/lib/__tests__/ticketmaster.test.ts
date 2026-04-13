import { searchTicketmaster } from '@/lib/ticketmaster';

global.fetch = jest.fn();

describe('searchTicketmaster', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns empty array when no events found', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ _embedded: { events: [] } }),
    });
    const result = await searchTicketmaster('no match', 'fake-key');
    expect(result).toEqual([]);
  });

  it('returns tickets when events found', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        _embedded: {
          events: [
            {
              priceRanges: [{ min: 60, max: 300, currency: 'EUR' }],
              priceRangeEntries: [],
              url: 'https://ticketmaster.com/event/1',
            },
          ],
        },
      }),
    });
    const result = await searchTicketmaster('barcelona vs madrid', 'key');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].source).toBe('Ticketmaster');
  });

  it('returns empty array on API error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 401 });
    const result = await searchTicketmaster('barcelona vs madrid', 'key');
    expect(result).toEqual([]);
  });
});
