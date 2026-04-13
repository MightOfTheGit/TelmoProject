'use client';
import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading: boolean;
  initialValue?: string;
}
export function SearchBar({ onSearch, loading, initialValue = '' }: SearchBarProps) {
  const [value, setValue] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length > 0) onSearch(trimmed);
  };

  return (
    <form role="form" onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="e.g. Barcelona FC vs Real Madrid"
        className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        disabled={loading}
        aria-label="Match search"
      />
      <button
        type="submit"
        disabled={loading || value.trim().length === 0}
        className="rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Searching\u2026' : 'Search'}
      </button>
    </form>
  );
}
