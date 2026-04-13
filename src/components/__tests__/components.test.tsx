import { render, screen, fireEvent } from '@testing-library/react';
import { Toast } from '@/components/Toast';
import { StadiumLocationBadge } from '@/components/StadiumLocationBadge';
import { PriceSummaryCard } from '@/components/PriceSummaryCard';
import { TicketCard } from '@/components/TicketCard';
import { SearchBar } from '@/components/SearchBar';
import type { Ticket } from '@/types/ticket';

const mockTicket: Ticket = {
  price: 89,
  currency: 'EUR',
  section: 'North Stand',
  source: 'SeatGeek',
  sourceLogoUrl: 'https://seatgeek.com/logo.png',
  url: 'https://seatgeek.com/event/1',
  isOfficial: false,
};

describe('Toast', () => {
  it('renders message', () => {
    render(<Toast message="Search complete!" visible onClose={() => {}} />);
    expect(screen.getByText('Search complete!')).toBeInTheDocument();
  });
  it('is hidden when visible is false', () => {
    const { container } = render(
      <Toast message="Hidden" visible={false} onClose={() => {}} />
    );
    expect(container.firstChild).toHaveClass('opacity-0');
  });
});

describe('StadiumLocationBadge', () => {
  it('renders section name', () => {
    render(<StadiumLocationBadge section="North Stand" />);
    expect(screen.getByText('North Stand')).toBeInTheDocument();
  });
});

describe('PriceSummaryCard', () => {
  it('shows cheapest and most expensive prices', () => {
    render(
      <PriceSummaryCard
        cheapest={mockTicket}
        mostExpensive={{ ...mockTicket, price: 500 }}
      />
    );
    expect(screen.getByText(/89/)).toBeInTheDocument();
    expect(screen.getByText(/500/)).toBeInTheDocument();
  });
});

describe('TicketCard', () => {
  it('renders ticket info', () => {
    render(<TicketCard ticket={mockTicket} />);
    expect(screen.getByText('North Stand')).toBeInTheDocument();
    expect(screen.getByText('SeatGeek')).toBeInTheDocument();
  });
  it('shows Official badge for official tickets', () => {
    render(<TicketCard ticket={{ ...mockTicket, isOfficial: true }} />);
    expect(screen.getByText('Official')).toBeInTheDocument();
  });
});

describe('SearchBar', () => {
  it('calls onSearch with query on submit', () => {
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} loading={false} />);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'barcelona vs madrid' },
    });
    fireEvent.submit(screen.getByRole('form'));
    expect(onSearch).toHaveBeenCalledWith('barcelona vs madrid');
  });
});
