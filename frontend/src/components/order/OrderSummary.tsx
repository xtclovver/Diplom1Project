import React from 'react';
import './OrderSummary.css';

interface OrderSummaryProps {
  tour: any;
  orderData: {
    tourId: string;
    tourDateId: number;
    roomId: number | null;
    adults: number;
    children: number;
    specialRequests: string;
    contactPhone: string;
    totalPrice: number;
  };
  startDate: string;
  endDate: string;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ 
  tour, 
  orderData, 
  startDate, 
  endDate 
}) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };
  
  // Рассчитываем количество дней тура
  const calculateDays = (): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 чтобы учесть день отъезда
  };
  
  // Функция для склонения слова "день"
  const getDaysText = (days: number): string => {
    if (days % 10 === 1 && days % 100 !== 11) {
      return 'день';
    } else if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) {
      return 'дня';
    } else {
      return 'дней';
    }
  };
  
  // Вычисляем стоимость для взрослых и детей
  const adultsCost = orderData.adults * tour.base_price;
  const childrenCost = orderData.children * (tour.base_price * 0.7); // 70% от базовой цены для детей
  
  const days = calculateDays();
  
  return (
    <div className="order-summary">
      <h3>Информация о заказе</h3>
      
      <div className="summary-tour-details">
        <div className="tour-image">
          <img src={tour.image_url || '/images/tour-placeholder.jpg'} alt={tour.name} />
        </div>
        
        <div className="tour-details">
          <h4>{tour.name}</h4>
          <div className="tour-location">
            <i className="fa fa-map-marker"></i> {tour.city?.name}, {tour.city?.country?.name}
          </div>
          <div className="tour-dates">
            <i className="fa fa-calendar"></i> {formatDate(startDate)} - {formatDate(endDate)}
            <span>({days} {getDaysText(days)})</span>
          </div>
        </div>
      </div>
      
      <div className="summary-section tourists-info">
        <h4>Туристы</h4>
        <div className="summary-item">
          <span className="summary-label">Взрослые:</span>
          <span className="summary-value">{orderData.adults} чел.</span>
        </div>
        {orderData.children > 0 && (
          <div className="summary-item">
            <span className="summary-label">Дети до 12 лет:</span>
            <span className="summary-value">{orderData.children} чел.</span>
          </div>
        )}
      </div>
      
      <div className="summary-section contact-info">
        <h4>Контактная информация</h4>
        <div className="summary-item">
          <span className="summary-label">Телефон:</span>
          <span className="summary-value">{orderData.contactPhone}</span>
        </div>
      </div>
      
      {orderData.specialRequests && (
        <div className="summary-section special-requests">
          <h4>Особые пожелания</h4>
          <p>{orderData.specialRequests}</p>
        </div>
      )}
      
      <div className="summary-section price-breakdown">
        <h4>Стоимость</h4>
        <div className="summary-item">
          <span className="summary-label">Стоимость для взрослых:</span>
          <span className="summary-value">{adultsCost.toLocaleString()} ₽</span>
        </div>
        {orderData.children > 0 && (
          <div className="summary-item">
            <span className="summary-label">Стоимость для детей:</span>
            <span className="summary-value">{childrenCost.toLocaleString()} ₽</span>
          </div>
        )}
      </div>
      
      <div className="total-price">
        <span className="total-label">Итого:</span>
        <span className="total-value">{orderData.totalPrice.toLocaleString()} ₽</span>
      </div>
    </div>
  );
};

export default OrderSummary; 