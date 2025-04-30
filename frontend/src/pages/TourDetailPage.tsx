import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../store/hooks';
import { fetchTourById, fetchTourDates } from '../store/tours/toursSlice';
import TourGallery from '../components/tour/TourGallery';
import TourInfo from '../components/tour/TourInfo';
import TourDateSelector from '../components/tour/TourDateSelector';
import HotelRooms from '../components/tour/HotelRooms';
import Spinner from '../components/ui/Spinner';
import './TourDetailPage.css';

interface Room {
  id: number;
  hotelId: number;
  description: string;
  beds: number;
  price: number;
  imageUrl: string;
}

const TourDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { tour, tourDates, loading, error } = useSelector((state: any) => state.tours);
  const [selectedDate, setSelectedDate] = useState<any>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);

  useEffect(() => {
    if (id) {
      dispatch(fetchTourById(id));
      dispatch(fetchTourDates(id));
    }
  }, [dispatch, id]);

  const handleDateSelect = (date: any) => {
    setSelectedDate(date);
    // Сбрасываем выбранную комнату при изменении даты
    setSelectedRoom(null);
  };

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
  };

  const handleBooking = () => {
    console.log('TourDetailPage - handleBooking вызвана');
    
    // Проверяем авторизацию
    if (!isAuthenticated) {
      console.log('TourDetailPage - пользователь не авторизован, перенаправление на /login');
      navigate('/login', { state: { from: `/tours/${id}` } });
      return;
    }
    
    // Проверяем выбор даты
    if (!selectedDate) {
      console.error('Необходимо выбрать дату тура');
      return;
    }
    
    console.log('TourDetailPage - данные для бронирования:', { 
      tourId: id, 
      tourDateId: selectedDate.id,
      roomId: selectedRoom?.id || null
    });
    
    // Сохраняем данные в sessionStorage
    const bookingData = {
      tourId: id,
      tourDateId: selectedDate.id,
      roomId: selectedRoom?.id || null,
      startDate: selectedDate.startDate || '',
      endDate: selectedDate.endDate || ''
    };
    
    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
    
    // Формируем URL параметры
    const params = new URLSearchParams();
    params.append('tourId', id || '');
    params.append('tourDateId', selectedDate.id.toString());
    
    if (selectedRoom?.id) {
      params.append('roomId', selectedRoom.id.toString());
    }
    
    // Выполняем навигацию
    const bookingUrl = `/booking?${params.toString()}`;
    console.log('TourDetailPage - переход на:', bookingUrl);
    
    navigate(bookingUrl, { state: bookingData });
  };

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Ошибка загрузки</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/tours')}>Вернуться к списку туров</button>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="error-container">
        <h2>Тур не найден</h2>
        <button onClick={() => navigate('/tours')}>Вернуться к списку туров</button>
      </div>
    );
  }

  return (
    <div className="tour-detail-page">
      <div className="tour-detail-header">
        <h1>{tour.name}</h1>
        <div className="tour-location">
          <i className="fa fa-map-marker"></i> 
          {tour.city && tour.city.name && tour.city.country && tour.city.country.name 
            ? `${tour.city.name}, ${tour.city.country.name}` 
            : 'Россия, Сочи'}
        </div>
      </div>

      <div className="tour-detail-content">
        <div className="tour-main-content">
          <TourGallery images={tour.images || [{ url: tour.imageUrl || tour.image_url }]} />
          <TourInfo tour={tour} />
        </div>

        <div className="tour-sidebar">
          <div className="booking-card">
            <div className="booking-price">
              от <span>{(tour.basePrice || tour.base_price || 0).toLocaleString()} ₽</span> / чел.
            </div>
            
            <div className="booking-duration">
              <i className="fa fa-clock-o"></i> {tour.duration} {getTourDurationText(tour.duration)}
            </div>
            
            <TourDateSelector 
              dates={tourDates} 
              onSelect={handleDateSelect} 
              selected={selectedDate}
              basePrice={tour.basePrice || tour.base_price || 0}
            />
            
            <button 
              className="booking-button" 
              onClick={handleBooking}
              disabled={!selectedDate}
            >
              Забронировать
            </button>
          </div>
        </div>
      </div>
      
      {selectedDate && (
        <div className="tour-hotel-rooms">
          <h2>Доступные номера в отеле</h2>
          <HotelRooms 
            hotelId={tour?.hotel?.id} 
            tourDateId={selectedDate.id}
            startDate={selectedDate.startDate}
            endDate={selectedDate.endDate}
            onRoomSelect={handleRoomSelect}
            selectedRoomId={selectedRoom?.id || null}
          />
        </div>
      )}
    </div>
  );
};

// Вспомогательная функция для склонения слова "день"
const getTourDurationText = (duration: number): string => {
  if (duration % 10 === 1 && duration % 100 !== 11) {
    return 'день';
  } else if ([2, 3, 4].includes(duration % 10) && ![12, 13, 14].includes(duration % 100)) {
    return 'дня';
  } else {
    return 'дней';
  }
};

export default TourDetailPage; 