import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTicketMessages } from '../../store/support/supportSlice';
import './SupportTicketChat.css';

interface Message {
  id: number;
  userId: number;
  message: string;
  createdAt: string;
  user: {
    username: string;
    role: string;
  };
}

interface SupportTicketChatProps {
  ticketId: number;
  onSendMessage: (ticketId: number, message: string) => void;
  onCloseTicket: (ticketId: number) => void;
}

const SupportTicketChat: React.FC<SupportTicketChatProps> = ({
  ticketId,
  onSendMessage,
  onCloseTicket
}) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const dispatch = useDispatch();
  const { ticketMessages, tickets, loading } = useSelector((state: any) => state.support);
  const { user } = useSelector((state: any) => state.auth);
  
  const currentTicket = tickets.find((ticket: any) => ticket.id === ticketId);
  const messages = ticketMessages[ticketId] || [];
  
  useEffect(() => {
    if (ticketId) {
      dispatch(fetchTicketMessages(ticketId) as any);
      // Устанавливаем интервал для обновления сообщений
      const interval = setInterval(() => {
        if (ticketId) {
          dispatch(fetchTicketMessages(ticketId) as any);
        }
      }, 10000); // Каждые 10 секунд
      
      return () => clearInterval(interval);
    }
  }, [dispatch, ticketId]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    onSendMessage(ticketId, message);
    setMessage('');
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
  
  if (!currentTicket) {
    return <div className="chat-loading">Загрузка тикета...</div>;
  }

  return (
    <div className="ticket-chat">
      <div className="ticket-chat-header">
        <h3>{currentTicket.subject}</h3>
        <div className="ticket-chat-info">
          <span className={`ticket-status ticket-status-${currentTicket.status}`}>
            {getStatusText(currentTicket.status)}
          </span>
          <span className="ticket-date">
            Создан: {formatDate(currentTicket.createdAt)}
          </span>
        </div>
        
        {currentTicket.status !== 'closed' && (
          <button
            className="close-ticket-button"
            onClick={() => onCloseTicket(ticketId)}
          >
            Закрыть тикет
          </button>
        )}
      </div>
      
      <div className="ticket-chat-messages">
        {loading && !messages.length && (
          <div className="chat-loading">Загрузка сообщений...</div>
        )}
        
        {messages.length === 0 && !loading && (
          <div className="no-messages">
            Нет сообщений в этом тикете. Начните диалог с нашей службой поддержки.
          </div>
        )}
        
        {messages.map((msg: Message) => (
          <div 
            key={msg.id} 
            className={`chat-message ${msg.userId === user.id ? 'user-message' : 'support-message'}`}
          >
            <div className="message-header">
              <span className="message-author">
                {msg.user.username} 
                {msg.user.role === 'support' && ' (Поддержка)'}
              </span>
              <span className="message-time">{formatDate(msg.createdAt)}</span>
            </div>
            <div className="message-content">{msg.message}</div>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>
      
      {currentTicket.status !== 'closed' && (
        <form onSubmit={handleSubmit} className="ticket-chat-form">
          <textarea
            className="chat-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Введите сообщение..."
            disabled={loading}
          />
          <button
            type="submit"
            className="send-message-button"
            disabled={!message.trim() || loading}
          >
            Отправить
          </button>
        </form>
      )}
      
      {currentTicket.status === 'closed' && (
        <div className="ticket-closed-message">
          Этот тикет закрыт. Если у вас возникли новые вопросы, создайте новый тикет.
        </div>
      )}
    </div>
  );
};

export default SupportTicketChat; 