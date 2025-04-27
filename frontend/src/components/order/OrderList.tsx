import React from 'react';
import { Link } from 'react-router-dom';
import OrderStatus from './OrderStatus';
import './OrderList.css';

interface Order {
  id: number;
  tour: {
    id: number;
    name: string;
    image_url: string;
  };
  start_date: string;
  end_date: string;
  status: string;
  total_price: number;
  created_at: string;
  adults: number;
  children: number;
}

interface OrderListProps {
  orders: Order[];
  onCancelOrder: (id: number) => void;
}

const OrderList: React.FC<OrderListProps> = ({ orders, onCancelOrder }) => {
  // Форматирование даты
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <div className="order-list">
      {orders.map((order) => (
        <div key={order.id} className="order-card">
          <div className="order-header">
            <div className="order-id">
              Заказ №{order.id}
            </div>
            <div className="order-date">
              от {formatDate(order.created_at)}
            </div>
          </div>
          
          <div className="order-content">
            <div className="order-image">
              <img src={order.tour.image_url || '/images/tour-placeholder.jpg'} alt={order.tour.name} />
            </div>
            
            <div className="order-details">
              <h3 className="order-tour-name">
                <Link to={`/tours/${order.tour.id}`}>{order.tour.name}</Link>
              </h3>
              
              <div className="order-tour-dates">
                {formatDate(order.start_date)} - {formatDate(order.end_date)}
              </div>
              
              <div className="order-tourists">
                {order.adults} взрослых
                {order.children > 0 && `, ${order.children} детей`}
              </div>
              
              <div className="order-price">
                {order.total_price.toLocaleString()} ₽
              </div>
            </div>
            
            <div className="order-status-container">
              <OrderStatus status={order.status} />
              
              {['PENDING', 'CONFIRMED'].includes(order.status) && (
                <button 
                  className="cancel-order-button" 
                  onClick={() => onCancelOrder(order.id)}
                >
                  Отменить
                </button>
              )}
              
              <Link to={`/orders/${order.id}`} className="view-order-button">
                Подробнее
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderList; 