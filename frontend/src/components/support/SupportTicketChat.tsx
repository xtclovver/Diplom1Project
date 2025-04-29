import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTicketMessages } from '../../store/support/supportSlice';
import './SupportTicketChat.css';

interface Message {
  id: number;
  ticketId: number;
  userId: number;
  message: string;
  createdAt: string;
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
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesRef = useRef<{length: number, hash: string}>({length: 0, hash: ''});
  
  const dispatch = useDispatch();
  
  // Безопасно получаем данные из Redux
  const supportState = useSelector((state: any) => state?.support || {});
  const { 
    tickets = [], 
    loading = false, 
    error = null 
  } = supportState;
  
  // Безопасно получаем информацию о тикет-сообщениях
  const ticketMessages = supportState.ticketMessages || {};
  const serverMessages = ticketMessages[ticketId] || [];
  
  // Объединяем серверные сообщения с локальными временными сообщениями
  const messages = localMessages.length > 0 ? localMessages : serverMessages;
  
  // Безопасно получаем данные пользователя
  const authState = useSelector((state: any) => state?.auth || {});
  const currentUser = authState.user || { id: null, username: 'Пользователь' };
  
  // Находим текущий тикет
  const currentTicket = Array.isArray(tickets) 
    ? tickets.find((ticket: any) => ticket?.id === ticketId) 
    : null;
  
  // Вспомогательная функция для получения имени пользователя по ID
  const getUsernameById = (userId: number): string => {
    // Если это текущий пользователь
    if (userId === currentUser.id) {
      return currentUser.username || 'Вы';
    }
    // Если это администратор или поддержка (примерно определяем по ID)
    if (userId === 1) {
      return 'Администратор';
    }
    return 'Служба поддержки';
  };
  
  // Загрузка сообщений при монтировании или изменении ticketId
  useEffect(() => {
    // Флаг, указывающий, был ли компонент размонтирован
    let isMounted = true;
    
    // Очищаем локальные сообщения при смене тикета
    if (isMounted) {
      setLocalMessages([]);
    }
    
    // Загружаем сообщения для текущего тикета, но только если их еще нет
    if (ticketId && (!ticketMessages[ticketId] || ticketMessages[ticketId].length === 0)) {
      try {
        dispatch(fetchTicketMessages(ticketId) as any);
      } catch (error) {
        console.error('Ошибка при загрузке сообщений:', error);
      }
    }
    
    // Очистка эффекта
    return () => {
      isMounted = false;
    };
  }, [dispatch, ticketId, ticketMessages]);
  
  // Обновляем локальные сообщения при получении новых с сервера и только если есть изменения
  useEffect(() => {
    // Проверяем, что serverMessages не пусты и изменились
    if (serverMessages.length > 0) {
      // Проверяем, изменились ли сообщения по ID
      const localIds = localMessages.map((m: Message) => m.id).sort().join(',');
      const serverIds = serverMessages.map((m: Message) => m.id).sort().join(',');
      
      if (localIds !== serverIds) {
        setLocalMessages(serverMessages);
      }
    }
  }, [serverMessages, localMessages]);
  
  // Периодическое обновление сообщений
  useEffect(() => {
    // Если тикет не выбран, не устанавливаем интервал
    if (!ticketId) return;
    
    // Проверяем, не показываем ли мы уже индикатор загрузки
    if (loading) return;
    
    // Переменная для хранения ID интервала
    let intervalId: NodeJS.Timeout;
    
    // Функция для обновления сообщений
    const updateMessages = () => {
      // Проверяем, не загружаются ли уже сообщения
      if (!loading) {
        dispatch(fetchTicketMessages(ticketId) as any);
      }
    };
    
    // Устанавливаем интервал
    intervalId = setInterval(updateMessages, 30000); // Каждые 30 секунд
    
    // Очистка интервала при размонтировании или изменении ticketId
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [dispatch, ticketId, loading]);
  
  // Скроллинг только при изменении количества сообщений
  useEffect(() => {
    // Скроллим вниз только если добавились новые сообщения
    const currentLength = messages.length;
    const currentHash = messages.map((m: Message) => m.id).join('-');
    
    // Если количество сообщений изменилось или добавилось новое сообщение, скроллим вниз
    if (currentLength > prevMessagesRef.current.length || 
        currentHash !== prevMessagesRef.current.hash) {
      scrollToBottom();
    }
    
    // Сохраняем текущее значение для следующего вызова
    prevMessagesRef.current = {length: currentLength, hash: currentHash};
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    // Создаем временное сообщение для оптимистичного обновления
    const tempMessage: Message = {
      id: Date.now(), // Временный ID
      ticketId: ticketId,
      userId: currentUser.id || 0,
      message: message.trim(),
      createdAt: new Date().toISOString()
    };
    
    // Оптимистично добавляем сообщение в локальный массив
    setLocalMessages([...serverMessages, tempMessage]);
    
    // Очищаем поле ввода перед отправкой
    setMessage('');
    
    // Отправляем сообщение на сервер
    onSendMessage(ticketId, message);
    
    // Скроллим вниз после добавления сообщения
    setTimeout(scrollToBottom, 100);
  };
  
  const formatDate = (dateString: string) => {
    try {
      // Проверяем, что dateString не пуст
      if (!dateString) {
        return 'Недавно';
      }
      
      // Приведение даты к формату ISO если нет Z или смещения часового пояса
      if (dateString.includes('T') && !dateString.includes('Z') && !dateString.includes('+')) {
        // Если нет миллисекунд, добавляем
        if (dateString.split('T')[1].split(':').length === 2) {
          dateString += ':00';
        }
        
        // Добавляем Z для UTC
        dateString += 'Z';
      }
      
      const date = new Date(dateString);
      
      // Если дата невалидная - возвращаем текущее время
      if (date.toString() === 'Invalid Date' || isNaN(date.getTime())) {
        console.warn('Невалидная дата:', dateString);
        return new Intl.DateTimeFormat('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(new Date());
      }
      
      return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Ошибка при форматировании даты:', error, dateString);
      return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date());
    }
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
        return status || 'Неизвестный статус';
    }
  };
  
  // Проверяем, что загрузка идет только в том случае, если тикет выбран и сообщения для него не загружены
  const isLoadingCurrentTicket = loading && ticketId && (!ticketMessages[ticketId] || ticketMessages[ticketId].length === 0);
  
  if (error) {
    return <div className="chat-error">Ошибка загрузки: {error}</div>;
  }
  
  if (!currentTicket) {
    return <div className="chat-loading">Тикет не найден. Пожалуйста, выберите другой тикет.</div>;
  }
  
  // Отображаем индикатор загрузки только если загружается именно этот тикет
  if (isLoadingCurrentTicket && !currentTicket) {
    return <div className="chat-loading">Загрузка тикета...</div>;
  }

  return (
    <div className="ticket-chat">
      <div className="ticket-chat-header">
        <h3>{currentTicket.subject || 'Без темы'}</h3>
        <div className="ticket-chat-info">
          <span className={`ticket-status ticket-status-${currentTicket.status || 'unknown'}`}>
            {getStatusText(currentTicket.status)}
          </span>
          <span className="ticket-date">
            Создан: {currentTicket.createdAt ? formatDate(currentTicket.createdAt) : new Intl.DateTimeFormat('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }).format(new Date())}
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
        {isLoadingCurrentTicket && !messages.length && (
          <div className="chat-loading">Загрузка сообщений...</div>
        )}
        
        {Array.isArray(messages) && messages.length > 0 ? (
          messages.map((msg: Message) => {
            // Проверяем, что у сообщения есть необходимые поля
            if (!msg || !msg.id) return null;
            
            return (
              <div 
                key={msg.id} 
                className={`chat-message ${msg.userId === currentUser.id ? 'user-message' : 'support-message'}`}
              >
                <div className="message-header">
                  <span className="message-author">
                    {getUsernameById(msg.userId)}
                  </span>
                  <span className="message-time">{formatDate(msg.createdAt)}</span>
                </div>
                <div className="message-content">{msg.message}</div>
              </div>
            );
          })
        ) : (
          !loading && (
            <div className="no-messages">
              Нет сообщений в этом тикете. Начните диалог с нашей службой поддержки.
            </div>
          )
        )}
        
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