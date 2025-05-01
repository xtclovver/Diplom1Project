import React from 'react';
import { Link } from 'react-router-dom';
import './TourCard.css';

const TourCard = ({ tour }) => {
  // Функция для форматирования цены
  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  return (
    <div className="tour-card">
      <div className="tour-img">
        <img 
          src={tour.imageUrl || ''} 
          alt={tour.name}
          className={!tour.imageUrl ? 'no-image' : ''} 
        />
        {tour.badge && (
          <span className="tour-badge">{tour.badge}</span>
        )}
        {tour.discount && (
          <span className="tour-discount">-{tour.discount}%</span>
        )}
      </div>
      <div className="tour-content">
        <div className="tour-rating">
          <div className="stars">
            {[...Array(Math.floor(tour.rating || 5))].map((_, i) => (
              <i key={i} className="fas fa-star"></i>
            ))}
            {tour.rating % 1 > 0 && <i className="fas fa-star-half-alt"></i>}
          </div>
          <span className="rating-value">{tour.rating}</span>
          {tour.reviews && <span className="reviews-count">({tour.reviews} отзывов)</span>}
        </div>
        
        <h3 className="tour-title">{tour.name}</h3>
        
        <div className="tour-details">
          {tour.location && (
            <div className="tour-location">
              <i className="fas fa-map-marker-alt"></i> {tour.location}
            </div>
          )}
          {tour.days && (
            <div className="tour-duration">
              <i className="far fa-calendar-alt"></i> {tour.days} {tour.days > 1 ? 'дней' : 'день'}
            </div>
          )}
        </div>
        
        <div className="tour-price">
          {tour.oldPrice && (
            <span className="old-price">{formatPrice(tour.oldPrice)} ₽</span>
          )}
          <span className="current-price">от {formatPrice(tour.price)} ₽</span>
        </div>
        
        <Link to={`/tours/${tour.id}`} className="view-tour-btn">
          Подробнее
        </Link>
      </div>
    </div>
  );
};

export default TourCard; 