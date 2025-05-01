import React from 'react';
import './OrderStatus.css';

interface OrderStatusProps {
  status: string;
}

const OrderStatus: React.FC<OrderStatusProps> = ({ status }) => {
  // Приводим статус к верхнему регистру для обеспечения совместимости
  const upperCaseStatus = status.toUpperCase();
  
  // Функция для перевода статуса на русский язык
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return 'Ожидает подтверждения';
      case 'CONFIRMED':
        return 'Подтвержден';
      case 'PAID':
        return 'Оплачен';
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
      case 'PAID':
        return 'paid';
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
    <div className={`order-status ${getStatusClass(upperCaseStatus)}`}>
      {getStatusText(upperCaseStatus)}
    </div>
  );
};

export default OrderStatus; 