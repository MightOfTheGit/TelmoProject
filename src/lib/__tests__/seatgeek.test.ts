import { searchSeatGeek } from '@/lib/seatgeek';

global.fetch = jest.fn();

describe('searchSeatGeek', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns empty array when no events found', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ events: [] }),
    });
    const result = await searchSeatGeek('no match here', 'fake-id', 'fake-secret');
    expect(result).toEqual([]);
  });

  it('returns tickets when events found', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        events: [
          {
            stats: { lowest_price: 80, highest_price: 300 },
            listings: [],
            url: 'https://seatgeek.com/event/1',
          },
        ],
      }),
    });
    const result = await searchSeatGeek('barcelona vs madrid', 'id', 'secret');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].source).toBe('SeatGeek');
  });

  it('returns empty array on API error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });
    const result = await searchSeatGeek('barcelona vs madrid', 'id', 'secret');
    expect(result).toEqual([]);
  });
});
