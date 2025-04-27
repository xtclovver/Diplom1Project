import { useEffect, useState, useRef, useCallback } from 'react';

const useWebSocket = (url, onMessage) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  // Инициализация соединения
  useEffect(() => {
    // Создаем WebSocket соединение
    socketRef.current = new WebSocket(url);

    // Обработчик открытия соединения
    socketRef.current.onopen = () => {
      setIsConnected(true);
      setError(null);
      console.log('WebSocket соединение установлено');
    };

    // Обработчик сообщений
    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (onMessage) {
        onMessage(data);
      }
    };

    // Обработчик ошибок
    socketRef.current.onerror = (event) => {
      setError('Ошибка WebSocket соединения');
      console.error('WebSocket ошибка:', event);
    };

    // Обработчик закрытия соединения
    socketRef.current.onclose = (event) => {
      setIsConnected(false);
      if (event.wasClean) {
        console.log(`WebSocket соединение закрыто корректно, код=${event.code} причина=${event.reason}`);
      } else {
        setError('Соединение прервано');
        console.error('WebSocket соединение прервано');
      }
    };

    // Закрываем соединение при размонтировании компонента
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [url, onMessage]);

  // Функция для отправки сообщений
  const sendMessage = useCallback((message) => {
    if (socketRef.current && isConnected) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.error('Невозможно отправить сообщение: соединение не установлено');
    }
  }, [isConnected]);

  // Функция для переподключения
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    
    socketRef.current = new WebSocket(url);
    
    socketRef.current.onopen = () => {
      setIsConnected(true);
      setError(null);
      console.log('WebSocket соединение восстановлено');
    };
    
    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (onMessage) {
        onMessage(data);
      }
    };
    
    socketRef.current.onerror = (event) => {
      setError('Ошибка WebSocket соединения');
      console.error('WebSocket ошибка:', event);
    };
    
    socketRef.current.onclose = (event) => {
      setIsConnected(false);
      if (event.wasClean) {
        console.log(`WebSocket соединение закрыто корректно, код=${event.code} причина=${event.reason}`);
      } else {
        setError('Соединение прервано');
        console.error('WebSocket соединение прервано');
      }
    };
  }, [url, onMessage]);

  return { isConnected, error, sendMessage, reconnect };
};

export default useWebSocket; 