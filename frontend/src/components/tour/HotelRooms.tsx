import React, { useEffect, useState } from 'react';
import { hotelService } from '../../services/api';
import './HotelRooms.css';

interface Room {
  id: number;
  hotelId: number;
  description: string;
  beds: number; // Количество спальных мест
  price: number;
  imageUrl: string;
  isAvailable?: boolean;
}

interface HotelRoomsProps {
  hotelId: number;
  tourDateId: number;
  startDate: string;
  endDate: string;
  onRoomSelect: (room: Room) => void;
  selectedRoomId: number | null;
}

const HotelRooms: React.FC<HotelRoomsProps> = ({ 
  hotelId, 
  tourDateId, 
  startDate, 
  endDate, 
  onRoomSelect, 
  selectedRoomId 
}) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hotelId && tourDateId) {
      fetchRooms();
    }
  }, [hotelId, tourDateId, startDate, endDate]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Получаем список номеров отеля
      const response = await hotelService.getHotelRooms(hotelId);
      const roomsData = response.data;
      
      // Проверяем доступность номеров на выбранные даты
      const roomsWithAvailability = await Promise.all(
        roomsData.map(async (room: Room) => {
          try {
            // Запрашиваем доступность номера на выбранные даты
            const availabilityResponse = await hotelService.getRoomAvailability(
              room.id.toString(),
              startDate,
              endDate
            );
            return {
              ...room,
              isAvailable: availabilityResponse.data.available
            };
          } catch (err) {
            console.error(`Error checking availability for room ${room.id}:`, err);
            return {
              ...room,
              isAvailable: false
            };
          }
        })
      );
      
      setRooms(roomsWithAvailability);
    } catch (err) {
      setError('Ошибка при загрузке номеров');
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rooms-loading">
        <div className="spinner"></div>
        <p>Загрузка доступных номеров...</p>
      </div>
    );
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
      <div className="room-card no-room">
        <div className="room-content">
          <h3 className="room-title">Без размещения</h3>
          <p className="room-description">Выберите этот вариант, если не хотите бронировать отель</p>
          <div className="room-footer">
            <div className="room-price">
              0 ₽
            </div>
            <button 
              className={`room-select-button ${selectedRoomId === null ? 'selected' : ''}`}
              onClick={() => onRoomSelect({ id: 0, hotelId, description: 'Без размещения', beds: 0, price: 0, imageUrl: '' })}
            >
              {selectedRoomId === null ? 'Выбрано' : 'Выбрать'}
            </button>
          </div>
        </div>
      </div>

      {rooms.map((room) => (
        <div key={room.id} className={`room-card ${!room.isAvailable ? 'not-available' : ''}`}>
          <div className="room-image">
            <img src={room.imageUrl || '/images/room-placeholder.jpg'} alt={room.description} />
          </div>
          <div className="room-content">
            <h3 className="room-title">{getBedTypeText(room.beds)}</h3>
            <div className="room-capacity">
              <i className="fa fa-user"></i> {room.beds} {getCapacityText(room.beds)}
            </div>
            <p className="room-description">{room.description}</p>
            
            <div className="room-footer">
              <div className="room-price">
                {room.price.toLocaleString()} ₽ <span>/ ночь</span>
              </div>
              
              {room.isAvailable ? (
                <button 
                  className={`room-select-button ${selectedRoomId === room.id ? 'selected' : ''}`}
                  onClick={() => onRoomSelect(room)}
                >
                  {selectedRoomId === room.id ? 'Выбрано' : 'Выбрать'}
                </button>
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

// Вспомогательная функция для получения типа номера по количеству мест
const getBedTypeText = (beds: number): string => {
  switch (beds) {
    case 1: return 'Одноместный номер';
    case 2: return 'Двухместный номер';
    case 3: return 'Трехместный номер';
    case 4: return 'Семейный номер';
    default: return `Номер на ${beds} мест`;
  }
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