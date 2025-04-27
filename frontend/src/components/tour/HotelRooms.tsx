import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { hotelService } from '../../services/api';
import Spinner from '../ui/Spinner';
import './HotelRooms.css';

interface HotelRoom {
  id: number;
  name: string;
  description: string;
  capacity: number;
  price_per_night: number;
  amenities: string[];
  image_url: string;
  available: boolean;
}

interface HotelRoomsProps {
  tourId: string | undefined;
  tourDateId: number;
}

const HotelRooms: React.FC<HotelRoomsProps> = ({ tourId, tourDateId }) => {
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tourId && tourDateId) {
      fetchRooms();
    }
  }, [tourId, tourDateId]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      // Здесь должен быть запрос к API для получения списка доступных номеров
      // Для примера используем моковые данные
      const response = await hotelService.getHotelRooms(1); // 1 - демо ID отеля
      
      // Симулируем проверку доступности номеров для выбранной даты
      const availableRooms = response.data.map((room: any) => ({
        ...room,
        available: Math.random() > 0.3 // Случайная доступность для демо
      }));
      
      setRooms(availableRooms);
    } catch (err) {
      setError('Ошибка при загрузке номеров');
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!rooms || rooms.length === 0) {
    return (
      <div className="no-rooms">
        <p>К сожалению, на данный момент нет доступных номеров для выбранной даты.</p>
      </div>
    );
  }

  return (
    <div className="hotel-rooms">
      {rooms.map((room) => (
        <div key={room.id} className={`room-card ${!room.available ? 'not-available' : ''}`}>
          <div className="room-image">
            <img src={room.image_url || '/images/room-placeholder.jpg'} alt={room.name} />
          </div>
          <div className="room-content">
            <h3 className="room-title">{room.name}</h3>
            <div className="room-capacity">
              <i className="fa fa-user"></i> {room.capacity} {getCapacityText(room.capacity)}
            </div>
            <p className="room-description">{room.description}</p>
            
            <div className="room-amenities">
              {room.amenities.map((amenity, index) => (
                <span key={index} className="amenity-tag">{amenity}</span>
              ))}
            </div>
            
            <div className="room-footer">
              <div className="room-price">
                {room.price_per_night.toLocaleString()} ₽ <span>/ ночь</span>
              </div>
              
              {room.available ? (
                <button className="room-select-button">Выбрать</button>
              ) : (
                <div className="room-unavailable">Нет мест</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Вспомогательная функция для склонения слова "человек"
const getCapacityText = (capacity: number): string => {
  if (capacity % 10 === 1 && capacity % 100 !== 11) {
    return 'человек';
  } else if ([2, 3, 4].includes(capacity % 10) && ![12, 13, 14].includes(capacity % 100)) {
    return 'человека';
  } else {
    return 'человек';
  }
};

export default HotelRooms; 