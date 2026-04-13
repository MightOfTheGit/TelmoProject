import type { Ticket } from '@/types/ticket';

interface PriceSummaryCardProps {
  cheapest: Ticket;
  mostExpensive: Ticket;
}
export function PriceSummaryCard({ cheapest, mostExpensive }: PriceSummaryCardProps) {
  return (
    <div className="grid grid-cols-2 gap-4 rounded-xl bg-white p-6 shadow-md">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-green-600">Cheapest</p>
        <p className="mt-1 text-3xl font-bold text-gray-900">
          {cheapest.currency === 'USD' ? '$' : cheapest.currency === 'GBP' ? '£' : '€'}
          {cheapest.price}
        </p>
        <a href={cheapest.url} target="_blank" rel="noopener noreferrer"
          className="mt-1 text-sm text-blue-600 hover:underline">
          {cheapest.source}
        </a>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Most Expensive</p>
        <p className="mt-1 text-3xl font-bold text-gray-900">
          {mostExpensive.currency === 'USD' ? '$' : mostExpensive.currency === 'GBP' ? '£' : '€'}
          {mostExpensive.price}
        </p>
        <a href={mostExpensive.url} target="_blank" rel="noopener noreferrer"
          className="mt-1 text-sm text-blue-600 hover:underline">
          {mostExpensive.source}
        </a>
      </div>
    </div>
  );
}
