import { generateDeepLinks } from '@/lib/deepLinks';

describe('generateDeepLinks', () => {
  it('generates deep links for all marketplaces', () => {
    const links = generateDeepLinks('barcelona vs real madrid');
    expect(links).toHaveLength(4);
    expect(links.map(l => l.name)).toEqual([
      'Viagogo', 'StubHub', 'LiveFootballTickets', 'Football Ticket Net'
    ]);
  });

  it('encodes query in URLs', () => {
    const links = generateDeepLinks('barcelona vs real madrid');
    const viagogo = links.find(l => l.name === 'Viagogo');
    expect(viagogo?.url).toContain('barcelona');
  });
});
