'use client';
import type { SavedSearch } from '@/types/ticket';

interface SavedSearchesPanelProps {
  savedSearches: SavedSearch[];
  onRemove: (id: string) => void;
  onRecheck: (query: string) => void;
}
export function SavedSearchesPanel({ savedSearches, onRemove, onRecheck }: SavedSearchesPanelProps) {
  if (savedSearches.length === 0) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-gray-800">Saved Searches</h2>
      <ul className="flex flex-col gap-3">
        {savedSearches.map(search => (
          <li key={search.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <div>
              <p className="font-medium text-gray-900">{search.query}</p>
              <p className="text-xs text-gray-500">
                Last checked: {new Date(search.lastCheckedAt).toLocaleString()}
                {search.lastCheapestPrice !== null && (
                  <> &bull; From {search.lastCheapestPrice} on {search.lastCheapestSource}</>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onRecheck(search.query)}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Re-check
              </button>
              <button
                onClick={() => onRemove(search.id)}
                className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
