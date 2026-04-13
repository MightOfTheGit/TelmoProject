import type { Ticket } from '@/types/ticket';
import { TicketCard } from '@/components/TicketCard';

interface OfficialTicketsBannerProps {
  tickets: Ticket[];
}
export function OfficialTicketsBanner({ tickets }: OfficialTicketsBannerProps) {
  if (tickets.length === 0) return null;
  return (
    <div className="rounded-xl border-2 border-green-300 bg-green-50 p-4">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-green-700">
        Official Club Tickets
      </h2>
      <div className="flex flex-col gap-2">
        {tickets.map((ticket, i) => (
          <TicketCard key={`official-${i}`} ticket={ticket} />
        ))}
      </div>
    </div>
  );
}
