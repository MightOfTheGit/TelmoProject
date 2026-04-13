'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { SearchResult } from '@/types/ticket';
import { PriceSummaryCard } from '@/components/PriceSummaryCard';
import { OfficialTicketsBanner } from '@/components/OfficialTicketsBanner';
import { TicketList } from '@/components/TicketList';
import { SourceLinksPanel } from '@/components/SourceLinksPanel';
import { SaveSearchButton } from '@/components/SaveSearchButton';
import { Toast } from '@/components/Toast';
import { SearchBar } from '@/components/SearchBar';
import { useSavedSearches } from '@/hooks/useSavedSearches';
import { useNotifications } from '@/hooks/useNotifications';

const RECHECK_INTERVAL_MS = 30 * 60 * 1000;

function ResultsPageContent() {
  const params = useSearchParams();
  const query = params.get('q') ?? '';

  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const { savedSearches, saveSearch, removeSearch, updateSearch, isSaved } = useSavedSearches();
  const { permission, requestPermission, sendNotification } = useNotifications();

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 5000);
  };

  const fetchResults = async (q: string): Promise<SearchResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Search failed');
      return await res.json() as SearchResult;
    } catch {
      setError('Something went wrong. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!query) return;
    fetchResults(query).then(data => {
      if (!data) return;
      setResult(data);
      const cheapest = data.tickets[0];
      showToast(
        cheapest
          ? `Search complete! Cheapest: ${cheapest.price} ${cheapest.currency} on ${cheapest.source}`
          : `Search complete! No tickets found.`
      );
      sendNotification('Search complete!', cheapest ? `From ${cheapest.price} ${cheapest.currency} on ${cheapest.source}` : 'No tickets found.');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const savedSearchesRef = useRef(savedSearches);
  savedSearchesRef.current = savedSearches;

  useEffect(() => {
    const interval = setInterval(async () => {
      for (const saved of savedSearchesRef.current) {
        const data = await fetchResults(saved.query);
        if (!data) continue;
        const newCheapest = data.tickets[0];
        const oldPrice = saved.lastCheapestPrice;
        updateSearch(saved.id, data);
        if (newCheapest && (oldPrice === null || newCheapest.price < oldPrice)) {
          showToast(`Price drop! ${saved.query} — now from ${newCheapest.price} on ${newCheapest.source}`);
          sendNotification(
            `Price drop! ${saved.query}`,
            `Now from ${newCheapest.price} ${newCheapest.currency} on ${newCheapest.source}`
          );
        }
      }
    }, RECHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const officialTickets = result?.tickets.filter(t => t.isOfficial) ?? [];
  const allTickets = result?.tickets ?? [];
  const cheapest = allTickets[0] ?? null;
  const mostExpensive = allTickets[allTickets.length - 1] ?? null;

  const handleSave = async () => {
    if (permission !== 'granted') await requestPermission();
    if (result) saveSearch(query, result);
    showToast(`Saved! You'll be notified of price changes.`);
  };

  const handleRemove = () => {
    const saved = savedSearches.find(s => s.query === query);
    if (saved) removeSearch(saved.id);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link href="/" className="mb-6 inline-block text-sm text-blue-600 hover:underline">
          &larr; New search
        </Link>

        <div className="mb-6">
          <SearchBar
            onSearch={q => { window.location.href = `/results?q=${encodeURIComponent(q)}`; }}
            loading={loading}
            initialValue={query}
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <span className="ml-4 text-gray-500">Searching for tickets…</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-red-700">{error}</div>
        )}

        {!loading && result && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">{query}</h1>
              <SaveSearchButton
                isSaved={isSaved(query)}
                onSave={handleSave}
                onRemove={handleRemove}
              />
            </div>

            {cheapest && mostExpensive && (
              <PriceSummaryCard cheapest={cheapest} mostExpensive={mostExpensive} />
            )}

            {officialTickets.length > 0 && (
              <OfficialTicketsBanner tickets={officialTickets} />
            )}

            <TicketList tickets={allTickets} />

            <SourceLinksPanel deepLinks={result.deepLinks} />
          </div>
        )}
      </div>

      <Toast message={toastMessage} visible={toastVisible} onClose={() => setToastVisible(false)} />
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>}>
      <ResultsPageContent />
    </Suspense>
  );
}
