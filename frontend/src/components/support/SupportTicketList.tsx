import React from 'react';
import './SupportTicketList.css';

interface Ticket {
  id: number;
  subject: string;
  status: string;
  createdAt: string;
}

interface SupportTicketListProps {
  tickets: Ticket[];
  selectedTicketId: number | null;
  onTicketSelect: (ticketId: number) => void;
}

const SupportTicketList: React.FC<SupportTicketListProps> = ({ 
  tickets, 
  selectedTicketId, 
  onTicketSelect 
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Открыт';
      case 'in_progress':
        return 'В обработке';
      case 'closed':
        return 'Закрыт';
      default:
        return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'open':
        return 'ticket-status-open';
      case 'in_progress':
        return 'ticket-status-in-progress';
      case 'closed':
        return 'ticket-status-closed';
      default:
        return '';
    }
  };

  return (
    <div className="support-ticket-list">
      {tickets.length === 0 ? (
        <div className="no-tickets-message">
          У вас нет активных тикетов. Создайте новый, чтобы связаться с нашей службой поддержки.
        </div>
      ) : (
        <ul className="ticket-list">
          {tickets.map((ticket) => (
            <li 
              key={ticket.id}
              className={`ticket-item ${selectedTicketId === ticket.id ? 'selected' : ''}`}
              onClick={() => onTicketSelect(ticket.id)}
            >
              <div className="ticket-header">
                <span className="ticket-subject">{ticket.subject}</span>
                <span className={`ticket-status ${getStatusClass(ticket.status)}`}>
                  {getStatusText(ticket.status)}
                </span>
              </div>
              <div className="ticket-date">
                {formatDate(ticket.createdAt)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SupportTicketList; 