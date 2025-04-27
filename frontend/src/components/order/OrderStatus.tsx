import React from 'react';
import './OrderStatus.css';

interface OrderStatusProps {
  status: string;
}

const OrderStatus: React.FC<OrderStatusProps> = ({ status }) => {
  // Функция для перевода статуса на русский язык
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return 'Ожидает подтверждения';
      case 'CONFIRMED':
        return 'Подтвержден';
      case 'PROCESSING':
        return 'Обрабатывается';
      case 'COMPLETED':
        return 'Завершен';
      case 'CANCELLED':
        return 'Отменен';
      default:
        return 'Неизвестный статус';
    }
  };
  
  // Функция для определения класса стиля на основе статуса
  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return 'pending';
      case 'CONFIRMED':
        return 'confirmed';
      case 'PROCESSING':
        return 'processing';
      case 'COMPLETED':
        return 'completed';
      case 'CANCELLED':
        return 'cancelled';
      default:
        return 'unknown';
    }
  };
  
  return (
    <div className={`order-status ${getStatusClass(status)}`}>
      {getStatusText(status)}
    </div>
  );
};

export default OrderStatus; 