import { renderHook, act } from '@testing-library/react';
import { useSavedSearches } from '@/hooks/useSavedSearches';

const mockResult = {
  tickets: [],
  deepLinks: [],
  query: 'barcelona vs madrid',
  fetchedAt: new Date().toISOString(),
};

describe('useSavedSearches', () => {
  beforeEach(() => localStorage.clear());

  it('starts with empty saved searches', () => {
    const { result } = renderHook(() => useSavedSearches());
    expect(result.current.savedSearches).toHaveLength(0);
  });

  it('saves a search', () => {
    const { result } = renderHook(() => useSavedSearches());
    act(() => {
      result.current.saveSearch('barcelona vs madrid', mockResult);
    });
    expect(result.current.savedSearches).toHaveLength(1);
    expect(result.current.savedSearches[0].query).toBe('barcelona vs madrid');
  });

  it('removes a search', () => {
    const { result } = renderHook(() => useSavedSearches());
    act(() => {
      result.current.saveSearch('barcelona vs madrid', mockResult);
    });
    const id = result.current.savedSearches[0].id;
    act(() => {
      result.current.removeSearch(id);
    });
    expect(result.current.savedSearches).toHaveLength(0);
  });

  it('checks if a query is already saved', () => {
    const { result } = renderHook(() => useSavedSearches());
    act(() => {
      result.current.saveSearch('barcelona vs madrid', mockResult);
    });
    expect(result.current.isSaved('barcelona vs madrid')).toBe(true);
    expect(result.current.isSaved('psg vs lyon')).toBe(false);
  });
});
