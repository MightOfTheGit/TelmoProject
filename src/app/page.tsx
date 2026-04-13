'use client';
import { useRouter } from 'next/navigation';
import { SearchBar } from '@/components/SearchBar';
import { SavedSearchesPanel } from '@/components/SavedSearchesPanel';
import { useSavedSearches } from '@/hooks/useSavedSearches';

export default function HomePage() {
  const router = useRouter();
  const { savedSearches, removeSearch } = useSavedSearches();

  const handleSearch = (query: string) => {
    router.push(`/results?q=${encodeURIComponent(query)}`);
  };

  const handleRecheck = (query: string) => {
    router.push(`/results?q=${encodeURIComponent(query)}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="mx-auto max-w-2xl px-4 py-20">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            Football Ticket Search
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            Find the cheapest tickets from official clubs, SeatGeek, Ticketmaster, and more.
          </p>
        </div>
        <SearchBar onSearch={handleSearch} loading={false} />
        <div className="mt-10">
          <SavedSearchesPanel
            savedSearches={savedSearches}
            onRemove={removeSearch}
            onRecheck={handleRecheck}
          />
        </div>
      </div>
    </main>
  );
}
