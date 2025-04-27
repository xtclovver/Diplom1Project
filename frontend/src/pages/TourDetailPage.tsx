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

const TourDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { tour, tourDates, loading, error } = useSelector((state: any) => state.tours);
  const [selectedDate, setSelectedDate] = useState<any>(null);
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);

  useEffect(() => {
    if (id) {
      dispatch(fetchTourById(id));
      dispatch(fetchTourDates(id));
    }
  }, [dispatch, id]);

  const handleDateSelect = (date: any) => {
    setSelectedDate(date);
  };

  const handleBooking = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/tours/${id}` } });
      return;
    }
    
    if (selectedDate) {
      navigate('/booking', { 
        state: { 
          tourId: id, 
          tourDateId: selectedDate.id,
          startDate: selectedDate.start_date,
          endDate: selectedDate.end_date
        } 
      });
    }
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
          <i className="fa fa-map-marker"></i> {tour.city?.name}, {tour.city?.country?.name}
        </div>
      </div>

      <div className="tour-detail-content">
        <div className="tour-main-content">
          <TourGallery images={tour.images || [{ url: tour.image_url }]} />
          <TourInfo tour={tour} />
        </div>

        <div className="tour-sidebar">
          <div className="booking-card">
            <div className="booking-price">
              от <span>{tour.base_price?.toLocaleString()} ₽</span> / чел.
            </div>
            
            <div className="booking-duration">
              <i className="fa fa-clock-o"></i> {tour.duration} {getTourDurationText(tour.duration)}
            </div>
            
            <TourDateSelector 
              dates={tourDates} 
              onSelect={handleDateSelect} 
              selected={selectedDate}
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
          <HotelRooms tourId={id} tourDateId={selectedDate.id} />
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