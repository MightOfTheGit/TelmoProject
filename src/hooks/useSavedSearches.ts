'use client';
import { useState, useEffect, useCallback } from 'react';
import type { SavedSearch, SearchResult } from '@/types/ticket';

const STORAGE_KEY = 'football-ticket-saved-searches';

function loadFromStorage(): SavedSearch[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedSearch[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage(searches: SavedSearch[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
}

export function useSavedSearches() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  useEffect(() => {
    setSavedSearches(loadFromStorage());
  }, []);

  const saveSearch = useCallback((query: string, result: SearchResult) => {
    const cheapestTicket = result.tickets[0] ?? null;
    const entry: SavedSearch = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      query,
      savedAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
      lastCheapestPrice: cheapestTicket?.price ?? null,
      lastCheapestSource: cheapestTicket?.source ?? null,
      lastResult: result,
    };
    setSavedSearches(prev => {
      const updated = [...prev, entry];
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const removeSearch = useCallback((id: string) => {
    setSavedSearches(prev => {
      const updated = prev.filter(s => s.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const updateSearch = useCallback((id: string, result: SearchResult) => {
    const cheapestTicket = result.tickets[0] ?? null;
    setSavedSearches(prev => {
      const updated = prev.map(s =>
        s.id === id
          ? {
              ...s,
              lastCheckedAt: new Date().toISOString(),
              lastCheapestPrice: cheapestTicket?.price ?? null,
              lastCheapestSource: cheapestTicket?.source ?? null,
              lastResult: result,
            }
          : s
      );
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const isSaved = useCallback(
    (query: string) => savedSearches.some(s => s.query === query),
    [savedSearches]
  );

  return { savedSearches, saveSearch, removeSearch, updateSearch, isSaved };
}
