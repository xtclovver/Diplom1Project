import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import useWebSocket from '../../hooks/useWebSocket';
import './Chat.css';

const Chat = ({ ticketId }) => {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);
  const { user } = useSelector(state => state.auth);
  
  // Базовый URL для WebSocket
  const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8081';
  
  // Обработчик входящих сообщений
  const handleMessage = (data) => {
    if (data.type === 'chat') {
      setMessages(prevMessages => [...prevMessages, {
        id: data.content.id || Date.now(),
        sender: data.content.sender,
        senderId: data.content.senderId,
        message: data.content.message,
        timestamp: data.content.timestamp || new Date().toISOString()
      }]);
    } else if (data.type === 'history') {
      // Добавляем историческое сообщение
      setMessages(prevMessages => {
        // Проверяем, не добавлено ли уже это сообщение
        if (!prevMessages.some(msg => msg.id === data.content.id)) {
          return [...prevMessages, {
            id: data.content.id,
            sender: data.content.sender,
            senderId: data.content.senderId,
            message: data.content.message,
            timestamp: data.content.timestamp
          }];
        }
        return prevMessages;
      });
    }
  };
  
  // Инициализируем WebSocket соединение
  const { isConnected, error, sendMessage, reconnect } = useWebSocket(
    `${WS_URL}/ws/chat/${ticketId}`,
    handleMessage
  );
  
  // Прокрутка чата вниз при получении новых сообщений
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Обработчик отправки сообщения
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageText.trim() && isConnected) {
      sendMessage({
        type: 'chat',
        content: {
          message: messageText,
          senderId: user.id
        }
      });
      setMessageText('');
    }
  };
  
  // Сортировка сообщений по времени
  const sortedMessages = [...messages].sort((a, b) => {
    return new Date(a.timestamp) - new Date(b.timestamp);
  });
  
  // Форматирование времени
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Определение, принадлежит ли сообщение текущему пользователю
  const isMyMessage = (senderId) => {
    return senderId === user.id;
  };
  
  return (
    <div className="chat">
      <div className="chat__header">
        <h3 className="chat__title">Чат по тикету #{ticketId}</h3>
        {!isConnected && (
          <div className="chat__status chat__status--offline">
            Офлайн
            <button className="chat__reconnect" onClick={reconnect}>
              Переподключиться
            </button>
          </div>
        )}
        {isConnected && (
          <div className="chat__status chat__status--online">
            Онлайн
          </div>
        )}
      </div>
      
      {error && (
        <div className="chat__error">
          {error}
          <button className="chat__reconnect" onClick={reconnect}>
            Попробовать снова
          </button>
        </div>
      )}
      
      <div className="chat__messages">
        {sortedMessages.length === 0 ? (
          <div className="chat__empty">
            Сообщений пока нет. Напишите первое сообщение!
          </div>
        ) : (
          sortedMessages.map(msg => (
            <div 
              key={msg.id} 
              className={`chat__message ${isMyMessage(msg.senderId) ? 'chat__message--mine' : 'chat__message--other'}`}
            >
              <div className="chat__message-header">
                <span className="chat__message-sender">{msg.sender}</span>
                <span className="chat__message-time">{formatTime(msg.timestamp)}</span>
              </div>
              <div className="chat__message-content">{msg.message}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat__form" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="chat__input"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Введите сообщение..."
          disabled={!isConnected}
        />
        <button 
          type="submit" 
          className="chat__send-button"
          disabled={!isConnected || !messageText.trim()}
        >
          Отправить
        </button>
      </form>
    </div>
  );
};

export default Chat; 