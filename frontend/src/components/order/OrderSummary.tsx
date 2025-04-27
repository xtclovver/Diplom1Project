import React from 'react';
import './OrderSummary.css';

interface Tour {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  imageUrl: string;
  duration: number;
  city: {
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
  tourDate: TourDate;
  selectedRoom: Room | null;
  bookingData: {
    tourId: string;
    tourDateId: number;
    roomId: number | null;
    peopleCount: number;
    totalPrice: number;
    contactPhone?: string;
    specialRequests?: string;
    email?: string;
  };
  onConfirm?: () => void;
  onEdit?: () => void;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ 
  tour, 
  tourDate, 
  selectedRoom,
  bookingData,
  onConfirm,
  onEdit
}) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };
  
  // Рассчитываем количество дней тура
  const calculateDays = (): number => {
    const start = new Date(tourDate.startDate);
    const end = new Date(tourDate.endDate);
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
  const baseTourCost = tour.basePrice * tourDate.priceModifier;
  
  // Рассчитываем стоимость проживания за все дни
  const roomCost = selectedRoom ? selectedRoom.price * (calculateDays() - 1) : 0; // -1 день, т.к. отель обычно бронируется на ночи
  
  // Общая стоимость тура для всех участников
  const totalTourCost = baseTourCost * bookingData.peopleCount;
  
  const days = calculateDays();
  
  return (
    <div className="order-summary">
      <h3>Информация о заказе</h3>
      
      <div className="summary-tour-details">
        <div className="tour-image">
          <img src={tour.imageUrl || '/images/tour-placeholder.jpg'} alt={tour.name} />
        </div>
        
        <div className="tour-details">
          <h4>{tour.name}</h4>
          <div className="tour-location">
            <i className="fa fa-map-marker"></i> {tour.city.name}, {tour.city.country.name}
          </div>
          <div className="tour-dates">
            <i className="fa fa-calendar"></i> {formatDate(tourDate.startDate)} - {formatDate(tourDate.endDate)}
            <span>({days} {getDaysText(days)})</span>
          </div>
        </div>
      </div>
      
      <div className="summary-section tourists-info">
        <h4>Туристы</h4>
        <div className="summary-item">
          <span className="summary-label">Количество человек:</span>
          <span className="summary-value">{bookingData.peopleCount} {getPeopleText(bookingData.peopleCount)}</span>
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
        {bookingData.email && (
          <div className="summary-item">
            <span className="summary-label">Email:</span>
            <span className="summary-value">{bookingData.email}</span>
          </div>
        )}
        {bookingData.contactPhone && (
          <div className="summary-item">
            <span className="summary-label">Телефон:</span>
            <span className="summary-value">{bookingData.contactPhone}</span>
          </div>
        )}
      </div>
      
      {bookingData.specialRequests && (
        <div className="summary-section special-requests">
          <h4>Особые пожелания</h4>
          <p>{bookingData.specialRequests}</p>
        </div>
      )}
      
      <div className="summary-section price-breakdown">
        <h4>Детализация стоимости</h4>
        <div className="summary-item">
          <span className="summary-label">Базовая стоимость тура:</span>
          <span className="summary-value">{baseTourCost.toLocaleString()} ₽ × {bookingData.peopleCount}</span>
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
        <span className="total-value">{bookingData.totalPrice.toLocaleString()} ₽</span>
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