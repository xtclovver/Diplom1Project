import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const AdminSupport: React.FC = () => {
  const dispatch = useDispatch();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  
  useEffect(() => {
    // Загрузка тикетов при монтировании компонента
    // Здесь должен быть запрос к API
    setLoading(true);
    
    // Имитация загрузки данных
    setTimeout(() => {
      setTickets([
        { 
          id: 1, 
          user: { id: 1, username: 'user1', fullName: 'Иванов Иван' },
          subject: 'Проблема с бронированием',
          status: 'open',
          createdAt: '2023-05-15T10:23:45',
          messages: [
            { id: 1, userId: 1, message: 'У меня не получается забронировать тур, пишет ошибку.', createdAt: '2023-05-15T10:23:45' },
            { id: 2, userId: 3, message: 'Здравствуйте! Подскажите, пожалуйста, какую ошибку вы видите?', createdAt: '2023-05-15T11:15:22' },
          ]
        },
        { 
          id: 2, 
          user: { id: 2, username: 'user2', fullName: 'Петров Петр' },
          subject: 'Вопрос по оплате',
          status: 'in_progress',
          createdAt: '2023-05-16T09:05:10',
          messages: [
            { id: 3, userId: 2, message: 'Добрый день! Как я могу оплатить тур онлайн?', createdAt: '2023-05-16T09:05:10' },
            { id: 4, userId: 3, message: 'Здравствуйте! На странице бронирования есть кнопка "Оплатить". После ее нажатия вы будете перенаправлены на страницу оплаты.', createdAt: '2023-05-16T09:30:45' },
            { id: 5, userId: 2, message: 'Спасибо! А какие способы оплаты доступны?', createdAt: '2023-05-16T09:35:20' },
          ]
        },
      ]);
      setLoading(false);
    }, 800);
  }, []);
  
  const handleSelectTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setNewMessage('');
  };
  
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedTicket) return;
    
    // В реальном приложении здесь будет запрос к API
    // dispatch(sendSupportMessage({ ticketId: selectedTicket.id, message: newMessage }));
    
    // Добавляем сообщение локально для демонстрации
    const newMessageObj = {
      id: Math.max(...selectedTicket.messages.map((m: any) => m.id)) + 1,
      userId: 3, // ID агента поддержки
      message: newMessage,
      createdAt: new Date().toISOString()
    };
    
    const updatedTicket = {
      ...selectedTicket,
      messages: [...selectedTicket.messages, newMessageObj]
    };
    
    setTickets(tickets.map(ticket => 
      ticket.id === selectedTicket.id ? updatedTicket : ticket
    ));
    
    setSelectedTicket(updatedTicket);
    setNewMessage('');
  };
  
  const handleChangeStatus = (ticketId: number, newStatus: string) => {
    // В реальном приложении здесь будет запрос к API
    // dispatch(updateTicketStatus({ ticketId, status: newStatus }));
    
    // Обновляем статус локально для демонстрации
    setTickets(tickets.map(ticket => 
      ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
    ));
    
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status: newStatus });
    }
  };
  
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Открыт';
      case 'in_progress':
        return 'В работе';
      case 'closed':
        return 'Закрыт';
      default:
        return status;
    }
  };
  
  return (
    <div className="admin-support">
      <div className="admin-header">
        <h2>Техническая поддержка</h2>
      </div>
      
      {loading ? (
        <div className="admin-loading">Загрузка...</div>
      ) : error ? (
        <div className="admin-error">{error}</div>
      ) : (
        <div className="support-container">
          <div className="tickets-list">
            <h3>Тикеты</h3>
            <div className="tickets-wrapper">
              {tickets.map(ticket => (
                <div 
                  key={ticket.id} 
                  className={`ticket-item ${selectedTicket?.id === ticket.id ? 'active' : ''} ${ticket.status}`}
                  onClick={() => handleSelectTicket(ticket)}
                >
                  <div className="ticket-header">
                    <span className="ticket-subject">{ticket.subject}</span>
                    <span className={`ticket-status status-${ticket.status}`}>
                      {getStatusLabel(ticket.status)}
                    </span>
                  </div>
                  <div className="ticket-info">
                    <span className="ticket-user">{ticket.user.fullName}</span>
                    <span className="ticket-date">{formatDate(ticket.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="ticket-details">
            {selectedTicket ? (
              <>
                <div className="ticket-detail-header">
                  <h3>{selectedTicket.subject}</h3>
                  <div className="ticket-actions">
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleChangeStatus(selectedTicket.id, e.target.value)}
                      className="status-select"
                    >
                      <option value="open">Открытый</option>
                      <option value="in_progress">В работе</option>
                      <option value="closed">Закрытый</option>
                    </select>
                  </div>
                </div>
                
                <div className="messages-container">
                  {selectedTicket.messages.map((message: any) => (
                    <div 
                      key={message.id} 
                      className={`message ${message.userId === 3 ? 'support-message' : 'user-message'}`}
                    >
                      <div className="message-content">{message.message}</div>
                      <div className="message-info">
                        <span className="message-time">{formatDate(message.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedTicket.status !== 'closed' && (
                  <div className="message-input-container">
                    <textarea
                      className="message-input"
                      placeholder="Введите ваше сообщение..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button 
                      className="send-button" 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                    >
                      Отправить
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="no-ticket-selected">
                Выберите тикет для просмотра
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSupport; 