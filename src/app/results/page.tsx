'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { SearchResult, Ticket } from '@/types/ticket';
import { PriceSummaryCard } from '@/components/PriceSummaryCard';
import { OfficialTicketsBanner } from '@/components/OfficialTicketsBanner';
import { TicketList } from '@/components/TicketList';
import { SourceLinksPanel } from '@/components/SourceLinksPanel';
import { SaveSearchButton } from '@/components/SaveSearchButton';
import { Toast } from '@/components/Toast';
import { SearchBar } from '@/components/SearchBar';
import { useSavedSearches } from '@/hooks/useSavedSearches';
import { useNotifications } from '@/hooks/useNotifications';
import { generateDeepLinks } from '@/lib/deepLinks';
import { findClubsInQuery } from '@/config/clubs';

const RECHECK_INTERVAL_MS = 30 * 60 * 1000;
const SEATGEEK_LOGO = 'https://seatgeek.com/images/favicons/favicon-32x32.png';
const TICKETMASTER_LOGO = 'https://www.ticketmaster.com/favicon.ico';

async function fetchTickets(query: string): Promise<SearchResult> {
  const deepLinks = generateDeepLinks(query);
  const clubs = findClubsInQuery(query.toLowerCase());
  const tickets: Ticket[] = [];

  // Club deep links as official placeholder tickets
  for (const club of clubs) {
    tickets.push({
      price: 0,
      currency: 'EUR',
      section: 'Official Club Allocation',
      source: `${club.name} Official`,
      sourceLogoUrl: club.logoUrl,
      url: club.ticketUrl,
      isOfficial: true,
    });
  }

  // SeatGeek (public API, no key required for basic search)
  try {
    const sgParams = new URLSearchParams({ q: query, type: 'sports', per_page: '20' });
    const sgRes = await fetch(`https://api.seatgeek.com/2/events?${sgParams}`);
    if (sgRes.ok) {
      const sgData = await sgRes.json();
      for (const event of (sgData.events ?? [])) {
        if (event.stats?.lowest_price) {
          tickets.push({
            price: event.stats.lowest_price,
            currency: 'USD',
            section: 'General Admission',
            source: 'SeatGeek',
            sourceLogoUrl: SEATGEEK_LOGO,
            url: event.url ?? 'https://seatgeek.com',
            isOfficial: false,
          });
        }
      }
    }
  } catch {
    // SeatGeek unavailable — continue with other sources
  }

  // Ticketmaster (requires API key — if not set, skip gracefully)
  const tmKey = process.env.NEXT_PUBLIC_TICKETMASTER_API_KEY;
  if (tmKey) {
    try {
      const tmParams = new URLSearchParams({ keyword: query, classificationName: 'sports', apikey: tmKey, size: '20' });
      const tmRes = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${tmParams}`);
      if (tmRes.ok) {
        const tmData = await tmRes.json();
        for (const event of (tmData?._embedded?.events ?? [])) {
          const range = event.priceRanges?.[0];
          if (range) {
            tickets.push({
              price: range.min,
              currency: range.currency ?? 'USD',
              section: 'General Admission',
              source: 'Ticketmaster',
              sourceLogoUrl: TICKETMASTER_LOGO,
              url: event.url ?? 'https://ticketmaster.com',
              isOfficial: false,
            });
          }
        }
      }
    } catch {
      // Ticketmaster unavailable — continue
    }
  }

  const sorted = tickets
    .filter(t => t.price > 0 || t.isOfficial)
    .sort((a, b) => {
      if (a.isOfficial && !b.isOfficial) return -1;
      if (!a.isOfficial && b.isOfficial) return 1;
      return a.price - b.price;
    });

  return { tickets: sorted, deepLinks, query, fetchedAt: new Date().toISOString() };
}

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

  const runSearch = async (q: string): Promise<SearchResult | null> => {
    setLoading(true);
    setError(null);
    try {
      return await fetchTickets(q);
    } catch {
      setError('Something went wrong. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!query) return;
    runSearch(query).then(data => {
      if (!data) return;
      setResult(data);
      const cheapest = data.tickets.find(t => !t.isOfficial) ?? data.tickets[0];
      showToast(
        cheapest
          ? `Search complete! Cheapest: ${cheapest.price > 0 ? cheapest.price + ' ' + cheapest.currency : 'check site'} on ${cheapest.source}`
          : `Search complete! No tickets found.`
      );
      sendNotification('Search complete!', cheapest ? `From ${cheapest.source}` : 'No tickets found.');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const savedSearchesRef = useRef(savedSearches);
  savedSearchesRef.current = savedSearches;

  useEffect(() => {
    const interval = setInterval(async () => {
      for (const saved of savedSearchesRef.current) {
        const data = await runSearch(saved.query);
        if (!data) continue;
        const newCheapest = data.tickets.find(t => !t.isOfficial && t.price > 0);
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
  const pricedTickets = allTickets.filter(t => t.price > 0);
  const cheapest = pricedTickets[0] ?? null;
  const mostExpensive = pricedTickets[pricedTickets.length - 1] ?? null;

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
            onSearch={q => { window.location.href = `./results/?q=${encodeURIComponent(q)}`; }}
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

        {!loading && result && allTickets.length === 0 && (
          <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-6 text-center">
            <p className="text-yellow-800 font-medium mb-2">No tickets found in our sources.</p>
            <p className="text-yellow-700 text-sm">Try searching directly on the sites below.</p>
          </div>
        )}

        {!loading && result && allTickets.length > 0 && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">{query}</h1>
              <SaveSearchButton
                isSaved={isSaved(query)}
                onSave={handleSave}
                onRemove={handleRemove}
              />
            </div>

            {cheapest && mostExpensive && cheapest !== mostExpensive && (
              <PriceSummaryCard cheapest={cheapest} mostExpensive={mostExpensive} />
            )}

            {officialTickets.length > 0 && (
              <OfficialTicketsBanner tickets={officialTickets} />
            )}

            <TicketList tickets={pricedTickets} />

            <SourceLinksPanel deepLinks={result.deepLinks} />
          </div>
        )}

        {!loading && result && (
          <div className="mt-6">
            <SourceLinksPanel deepLinks={generateDeepLinks(query)} />
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
