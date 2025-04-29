import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import './TourCard.css';

const TourCard = ({ tour, horizontal = false }) => {
  // Функция для форматирования цены
  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  // Функция для сокращения текста описания до определенной длины
  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Определяем класс карточки в зависимости от параметра horizontal
  const cardClass = `tour-card ${horizontal ? 'tour-card-horizontal' : ''}`;

  return (
    <div className={cardClass}>
      <div className="tour-image">
        <img src={tour.imageUrl || '/images/tour-placeholder.jpg'} alt={tour.name} />
        {tour.badge && (
          <span className="tour-badge">{tour.badge}</span>
        )}
        {tour.discount && (
          <span className="tour-discount">-{tour.discount}%</span>
        )}
      </div>
      
      <div className="tour-content">
        <h3 className="tour-title">
          <Link to={`/tours/${tour.id}`}>
            {tour.name}
          </Link>
        </h3>
        
        <div className="tour-info">
          <div className="tour-info-item">
            <i className="fas fa-map-marker-alt"></i> 
            {tour.city.name}, {tour.city.country.name}
          </div>
          <div className="tour-info-item">
            <i className="fas fa-calendar-alt"></i> 
            {tour.duration} {getDurationText(tour.duration)}
          </div>
        </div>
        
        {tour.rating && (
          <div className="tour-rating">
            <div className="tour-stars">
              {Array.from({ length: Math.floor(tour.rating) }).map((_, i) => (
                <i key={i} className="fas fa-star"></i>
              ))}
              {tour.rating % 1 > 0 && <i className="fas fa-star-half-alt"></i>}
            </div>
            <span className="tour-rating-value">{tour.rating}</span>
            {tour.reviewCount && (
              <span className="tour-rating-count">({tour.reviewCount} отзывов)</span>
            )}
          </div>
        )}
        
        {tour.features && tour.features.length > 0 && (
          <div className="tour-features">
            {tour.features.slice(0, 3).map((feature, index) => (
              <span key={index} className="tour-feature">
                <i className="fas fa-check"></i> {feature}
              </span>
            ))}
          </div>
        )}
        
        <p className="tour-description">
          {truncateText(tour.description)}
        </p>
        
        <div className="tour-footer">
          <div className="tour-price">
            от <span>{formatPrice(tour.basePrice)}</span> ₽
            {tour.oldPrice && (
              <small className="tour-old-price">{formatPrice(tour.oldPrice)} ₽</small>
            )}
          </div>
          
          <Link to={`/tours/${tour.id}`} className="tour-button">
            Подробнее
          </Link>
        </div>
      </div>
    </div>
  );
};

// Функция для определения правильного склонения слова "день"
const getDurationText = (days) => {
  if (days % 10 === 1 && days % 100 !== 11) {
    return 'день';
  } else if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) {
    return 'дня';
  } else {
    return 'дней';
  }
};

TourCard.propTypes = {
  tour: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    imageUrl: PropTypes.string,
    basePrice: PropTypes.number.isRequired,
    oldPrice: PropTypes.number,
    duration: PropTypes.number.isRequired,
    badge: PropTypes.string,
    discount: PropTypes.number,
    rating: PropTypes.number,
    reviewCount: PropTypes.number,
    features: PropTypes.arrayOf(PropTypes.string),
    city: PropTypes.shape({
      name: PropTypes.string.isRequired,
      country: PropTypes.shape({
        name: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
  horizontal: PropTypes.bool
};

export default TourCard; 