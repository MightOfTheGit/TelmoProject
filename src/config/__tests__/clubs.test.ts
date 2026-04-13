import { findClubsInQuery, CLUBS } from '@/config/clubs';

describe('findClubsInQuery', () => {
  it('finds Barcelona in query', () => {
    const result = findClubsInQuery('barcelona fc vs real madrid');
    expect(result.map(c => c.name)).toContain('FC Barcelona');
  });

  it('finds Real Madrid in query', () => {
    const result = findClubsInQuery('barcelona fc vs real madrid');
    expect(result.map(c => c.name)).toContain('Real Madrid');
  });

  it('returns empty array for unknown clubs', () => {
    const result = findClubsInQuery('unknown team vs another team');
    expect(result).toHaveLength(0);
  });

  it('is case-insensitive', () => {
    const result = findClubsInQuery('LIVERPOOL vs ARSENAL');
    expect(result.map(c => c.name)).toContain('Liverpool FC');
    expect(result.map(c => c.name)).toContain('Arsenal FC');
  });
});
