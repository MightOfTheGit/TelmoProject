import type { Ticket } from '@/types/ticket';
import { TicketCard } from '@/components/TicketCard';

interface TicketListProps {
  tickets: Ticket[];
}
export function TicketList({ tickets }: TicketListProps) {
  if (tickets.length === 0) {
    return <p className="text-center text-gray-500 py-8">No tickets found for this match.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      {tickets.map((ticket, i) => (
        <TicketCard key={`${ticket.source}-${ticket.price}-${i}`} ticket={ticket} />
      ))}
    </div>
  );
}
