import React from 'react';
import { Link } from 'react-router-dom';
import './TourList.css';

interface Tour {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  basePrice: number;
  duration: number;
  city: {
    id: number;
    name: string;
    country: {
      id: number;
      name: string;
      code: string;
    };
  };
}

interface TourListProps {
  tours: Tour[];
  loading?: boolean;
}

const TourList: React.FC<TourListProps> = ({ tours, loading }) => {
  if (loading) {
    return (
      <div className="loading-tours">
        <div className="spinner"></div>
        <p>Загрузка туров...</p>
      </div>
    );
  }

  if (!tours || tours.length === 0) {
    return (
      <div className="empty-tours">
        <h3>По вашему запросу ничего не найдено</h3>
        <p>Попробуйте изменить параметры поиска</p>
      </div>
    );
  }

  return (
    <div className="tour-list">
      {tours.map((tour) => (
        <div key={tour.id} className="tour-card">
          <div className="tour-image">
            <img src={tour.imageUrl || '/images/tour-placeholder.jpg'} alt={tour.name} />
          </div>
          <div className="tour-content">
            <h3 className="tour-title">{tour.name}</h3>
            <div className="tour-location">
              <i className="fa fa-map-marker"></i> {tour.city.name}, {tour.city.country.name}
            </div>
            <div className="tour-duration">
              <i className="fa fa-clock-o"></i> {tour.duration} {getTourDurationText(tour.duration)}
            </div>
            <p className="tour-description">{truncateText(tour.description, 150)}</p>
            <div className="tour-footer">
              <div className="tour-price">
                от <span>{tour.basePrice.toLocaleString()} ₽</span>
              </div>
              <Link to={`/tours/${tour.id}`} className="tour-button">
                Подробнее
              </Link>
            </div>
          </div>
        </div>
      ))}
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

// Вспомогательная функция для обрезки текста
const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export default TourList; 