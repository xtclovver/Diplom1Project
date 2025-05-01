import React from 'react';
import './OrderSummary.css';

interface Tour {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  imageUrl: string;
  duration: number;
  city?: {
    id: number;
    name: string;
    country: {
      id: number;
      name: string;
      code: string;
    }
  };
}

interface TourDate {
  id: number;
  tourId: number;
  startDate: string;
  endDate: string;
  availability: number;
  priceModifier: number;
}

interface Room {
  id: number;
  hotelId: number;
  description: string;
  beds: number;
  price: number;
  imageUrl: string;
}

interface OrderSummaryProps {
  tour: Tour;
  tourDate?: TourDate;
  selectedRoom?: Room | null;
  orderData: {
    tourId: string;
    tourDateId: number;
    roomId: number | null;
    adults?: number;
    children?: number;
    peopleCount?: number;
    totalPrice: number;
    contactPhone?: string;
    specialRequests?: string;
    email?: string;
  };
  startDate?: string;
  endDate?: string;
  onConfirm?: () => void;
  onEdit?: () => void;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ 
  tour, 
  tourDate, 
  selectedRoom,
  orderData,
  startDate,
  endDate,
  onConfirm,
  onEdit
}) => {
  const formatDate = (dateString: string): string => {
    if (!dateString) return "Нет даты";
    
    try {
      // Проверяем, если дата в ISO формате (YYYY-MM-DDTHH:mm:ss.sssZ)
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        // Если не получилось распарсить, пробуем другие форматы
        // Проверяем формат YYYY-MM-DD
        if (dateString.includes('-')) {
          const parts = dateString.split('-');
          if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // месяцы в JS с 0
            const day = parseInt(parts[2], 10);
            const newDate = new Date(year, month, day);
            if (!isNaN(newDate.getTime())) {
              return newDate.toLocaleDateString('ru-RU');
            }
          }
        }
        
        // Если всё ещё не удалось, возвращаем исходную строку
        return dateString;
      }
      
      return date.toLocaleDateString('ru-RU');
    } catch (error) {
      console.error("Ошибка форматирования даты:", error);
      return dateString;
    }
  };
  
  // Рассчитываем количество дней тура
  const calculateDays = (): number => {
    try {
      if (!tourDate?.startDate || !tourDate?.endDate) {
        return tour.duration || 1; // Используем duration из тура или 1 день по умолчанию
      }
      
      // Парсим даты
      const parseDate = (dateStr: string): Date | null => {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) return date;
        
        // Если стандартный парсинг не сработал, проверяем формат YYYY-MM-DD
        if (dateStr.includes('-')) {
          const parts = dateStr.split('-');
          if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            const newDate = new Date(year, month, day);
            if (!isNaN(newDate.getTime())) return newDate;
          }
        }
        
        return null;
      };
      
      const start = parseDate(tourDate.startDate);
      const end = parseDate(tourDate.endDate);
      
      if (!start || !end) {
        return tour.duration || 1;
      }
      
      const diffTime = Math.abs(end.getTime() - start.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 чтобы учесть день отъезда
    } catch (error) {
      console.error("Ошибка при расчете длительности тура:", error);
      return tour.duration || 1;
    }
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
  
  // Функция для склонения слова "человек"
  const getPeopleText = (count: number): string => {
    if (count % 10 === 1 && count % 100 !== 11) {
      return 'человек';
    } else if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
      return 'человека';
    } else {
      return 'человек';
    }
  };
  
  // Рассчитываем базовую стоимость тура с учетом модификатора цены
  const baseTourCost = tour.basePrice * (tourDate?.priceModifier || 1);
  
  // Рассчитываем стоимость проживания за все дни
  const roomCost = selectedRoom ? selectedRoom.price * (calculateDays() - 1) : 0; // -1 день, т.к. отель обычно бронируется на ночи
  
  // Общая стоимость тура для всех участников
  const totalTourCost = baseTourCost * (orderData.peopleCount || 0);
  
  const days = calculateDays();
  
  return (
    <div className="order-summary">
      <h3>Информация о заказе</h3>
      
      <div className="summary-tour-details">
        <div className="tour-image">
          <img src={tour.imageUrl || ''} alt={tour.name} className={!tour.imageUrl ? 'no-image' : ''} />
        </div>
        
        <div className="tour-details">
          <h4>{tour.name}</h4>
          {tour.city && (
            <div className="tour-location">
              <i className="fa fa-map-marker"></i> {tour.city.name}, {tour.city.country.name}
            </div>
          )}
          <div className="tour-dates">
            <i className="fa fa-calendar"></i> {formatDate(tourDate?.startDate || '')} - {formatDate(tourDate?.endDate || '')}
            <span>({days} {getDaysText(days)})</span>
          </div>
        </div>
      </div>
      
      <div className="summary-section tourists-info">
        <h4>Туристы</h4>
        <div className="summary-item">
          <span className="summary-label">Количество человек:</span>
          <span className="summary-value">{orderData.peopleCount || 0} {getPeopleText(orderData.peopleCount || 0)}</span>
        </div>
      </div>
      
      {selectedRoom && (
        <div className="summary-section room-info">
          <h4>Проживание</h4>
          <div className="summary-item">
            <span className="summary-label">Тип номера:</span>
            <span className="summary-value">{selectedRoom.description}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Стоимость за ночь:</span>
            <span className="summary-value">{selectedRoom.price.toLocaleString()} ₽</span>
          </div>
        </div>
      )}
      
      <div className="summary-section contact-info">
        <h4>Контактная информация</h4>
        {orderData.email && (
          <div className="summary-item">
            <span className="summary-label">Email:</span>
            <span className="summary-value">{orderData.email}</span>
          </div>
        )}
        {orderData.contactPhone && (
          <div className="summary-item">
            <span className="summary-label">Телефон:</span>
            <span className="summary-value">{orderData.contactPhone}</span>
          </div>
        )}
      </div>
      
      {orderData.specialRequests && (
        <div className="summary-section special-requests">
          <h4>Особые пожелания</h4>
          <p>{orderData.specialRequests}</p>
        </div>
      )}
      
      <div className="summary-section price-breakdown">
        <h4>Детализация стоимости</h4>
        <div className="summary-item">
          <span className="summary-label">Базовая стоимость тура:</span>
          <span className="summary-value">{baseTourCost.toLocaleString()} ₽ × {orderData.peopleCount || 0}</span>
        </div>
        {selectedRoom && (
          <div className="summary-item">
            <span className="summary-label">Проживание за {days-1} {getDaysText(days-1)}:</span>
            <span className="summary-value">{roomCost.toLocaleString()} ₽</span>
          </div>
        )}
      </div>
      
      <div className="total-price">
        <span className="total-label">Итого:</span>
        <span className="total-value">{orderData.totalPrice.toLocaleString()} ₽</span>
      </div>
      
      {(onConfirm || onEdit) && (
        <div className="summary-actions">
          {onEdit && (
            <button className="summary-edit-button" onClick={onEdit}>
              Изменить данные
            </button>
          )}
          {onConfirm && (
            <button className="summary-confirm-button" onClick={onConfirm}>
              Подтвердить и оплатить
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderSummary; 