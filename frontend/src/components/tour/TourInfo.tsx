import React, { useState } from 'react';
import './TourInfo.css';

// Определение типов данных
interface Hotel {
  id: number;
  name: string;
  description: string;
  address: string;
  category: number; // Количество звезд
  imageUrl: string;
}

interface Tour {
  id: number;
  name: string;
  description: string;
  basePrice?: number;
  base_price?: number;
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
  hotel?: Hotel;
  program?: string;
  included?: string[];
  excluded?: string[];
}

interface TourInfoProps {
  tour: Tour;
  loading?: boolean;
}

const TourInfo: React.FC<TourInfoProps> = ({ tour, loading }) => {
  const [activeTab, setActiveTab] = useState('description');
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  
  if (loading) {
    return (
      <div className="tour-info-loading">
        <div className="spinner"></div>
        <p>Загрузка информации о туре...</p>
      </div>
    );
  }
  
  if (!tour) {
    return (
      <div className="tour-info-error">
        <p>Информация о туре не найдена</p>
      </div>
    );
  }
  
  // Получаем цену, учитывая возможные разные названия свойств
  const price = tour.basePrice || tour.base_price || 0;
  
  return (
    <div className="tour-info">
      <div className="tour-info-tabs">
        <button 
          className={`tab-button ${activeTab === 'description' ? 'active' : ''}`}
          onClick={() => handleTabChange('description')}
        >
          Описание
        </button>
        <button 
          className={`tab-button ${activeTab === 'program' ? 'active' : ''}`}
          onClick={() => handleTabChange('program')}
        >
          Программа
        </button>
        <button 
          className={`tab-button ${activeTab === 'hotel' ? 'active' : ''}`}
          onClick={() => handleTabChange('hotel')}
        >
          Отель
        </button>
        <button 
          className={`tab-button ${activeTab === 'included' ? 'active' : ''}`}
          onClick={() => handleTabChange('included')}
        >
          Включено в тур
        </button>
      </div>
      
      <div className="tour-info-content">
        {activeTab === 'description' && (
          <div className="tab-content description">
            <h3>Описание тура</h3>
            <p>{tour.description}</p>
            <div className="tour-details">
              <div className="detail-item">
                <span className="detail-label">Направление:</span>
                <span className="detail-value">
                  {tour.city && tour.city.name && tour.city.country && tour.city.country.name 
                    ? `${tour.city.name}, ${tour.city.country.name}` 
                    : 'Россия, Сочи'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Продолжительность:</span>
                <span className="detail-value">{tour.duration} {getTourDurationText(tour.duration)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Базовая стоимость:</span>
                <span className="detail-value">{price.toLocaleString()} ₽</span>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'program' && (
          <div className="tab-content program">
            <h3>Программа тура</h3>
            {tour.program ? (
              <div dangerouslySetInnerHTML={{ __html: tour.program }} />
            ) : (
              <p>Программа тура будет добавлена позже.</p>
            )}
          </div>
        )}
        
        {activeTab === 'hotel' && (
          <div className="tab-content hotel">
            <h3>Информация об отеле</h3>
            {tour.hotel ? (
              <div className="hotel-info">
                <h4>{tour.hotel.name}</h4>
                <div className="hotel-rating">
                  {Array.from({ length: tour.hotel.category }, (_, index) => (
                    <i key={index} className="fa fa-star"></i>
                  ))}
                </div>
                <div className="hotel-address">
                  <i className="fa fa-map-marker"></i> {tour.hotel.address}
                </div>
                <p>{tour.hotel.description}</p>
              </div>
            ) : (
              <p>Информация об отеле будет добавлена позже.</p>
            )}
          </div>
        )}
        
        {activeTab === 'included' && (
          <div className="tab-content included">
            <h3>Включено в тур</h3>
            <div className="included-columns">
              <div className="included-column">
                <h4>В стоимость включено:</h4>
                <ul className="included-list">
                  {tour.included && tour.included.length > 0 ? (
                    tour.included.map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))
                  ) : (
                    <li>Информация будет добавлена позже</li>
                  )}
                </ul>
              </div>
              
              <div className="included-column">
                <h4>Дополнительно оплачивается:</h4>
                <ul className="excluded-list">
                  {tour.excluded && tour.excluded.length > 0 ? (
                    tour.excluded.map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))
                  ) : (
                    <li>Информация будет добавлена позже</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
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

export default TourInfo; 