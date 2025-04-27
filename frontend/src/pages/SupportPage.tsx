import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  fetchUserTickets, 
  createTicket, 
  closeTicket,
  sendMessage 
} from '../store/support/supportSlice';
import SupportTicketList from '../components/support/SupportTicketList';
import SupportTicketChat from '../components/support/SupportTicketChat';
import SupportTicketForm from '../components/support/SupportTicketForm';
import './SupportPage.css';

const SupportPage: React.FC = () => {
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { tickets, loading, error } = useSelector((state: any) => state.support);
  const { isAuthenticated } = useSelector((state: any) => state.auth);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    dispatch(fetchUserTickets() as any);
  }, [dispatch, isAuthenticated, navigate]);
  
  const handleTicketSelect = (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setShowNewTicketForm(false);
  };
  
  const handleCreateTicket = (subject: string, message: string) => {
    dispatch(createTicket({ subject, message }) as any)
      .then(() => {
        setShowNewTicketForm(false);
      });
  };
  
  const handleCloseTicket = (ticketId: number) => {
    dispatch(closeTicket(ticketId) as any)
      .then(() => {
        setSelectedTicketId(null);
      });
  };
  
  const handleSendMessage = (ticketId: number, message: string) => {
    dispatch(sendMessage({ ticketId, message }) as any);
  };
  
  const handleNewTicketClick = () => {
    setShowNewTicketForm(true);
    setSelectedTicketId(null);
  };

  if (loading && !tickets.length) {
    return <div className="support-loading">Загрузка...</div>;
  }

  if (error) {
    return <div className="support-error">Ошибка: {error}</div>;
  }

  return (
    <div className="support-page">
      <div className="support-container">
        <div className="support-sidebar">
          <div className="support-header">
            <h2>Техническая поддержка</h2>
            <button 
              className="new-ticket-button" 
              onClick={handleNewTicketClick}
            >
              Новый тикет
            </button>
          </div>
          
          <SupportTicketList 
            tickets={tickets} 
            selectedTicketId={selectedTicketId}
            onTicketSelect={handleTicketSelect}
          />
        </div>
        
        <div className="support-content">
          {showNewTicketForm ? (
            <SupportTicketForm onSubmit={handleCreateTicket} />
          ) : selectedTicketId ? (
            <SupportTicketChat 
              ticketId={selectedTicketId} 
              onSendMessage={handleSendMessage}
              onCloseTicket={handleCloseTicket}
            />
          ) : (
            <div className="support-empty-state">
              <h3>Выберите тикет или создайте новый</h3>
              <p>
                Здесь вы можете связаться с нашей службой поддержки по любым вопросам, 
                связанным с бронированием туров или использованием сайта.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportPage; 