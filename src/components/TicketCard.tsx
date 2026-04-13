import type { Ticket } from '@/types/ticket';
import { StadiumLocationBadge } from '@/components/StadiumLocationBadge';

interface TicketCardProps {
  ticket: Ticket;
}
export function TicketCard({ ticket }: TicketCardProps) {
  const symbol = ticket.currency === 'USD' ? '$' : ticket.currency === 'GBP' ? '£' : '€';
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-gray-900">{symbol}{ticket.price}</span>
          {ticket.isOfficial && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Official</span>
          )}
        </div>
        <StadiumLocationBadge section={ticket.section} />
        {ticket.row && <span className="text-xs text-gray-500">Row {ticket.row}</span>}
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <img src={ticket.sourceLogoUrl} alt={ticket.source} className="h-5 w-5 rounded" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <span className="text-sm text-gray-600">{ticket.source}</span>
        </div>
        <a href={ticket.url} target="_blank" rel="noopener noreferrer"
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
          Buy
        </a>
      </div>
    </div>
  );
}
