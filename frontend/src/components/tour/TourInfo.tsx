import React, { useState } from 'react';
import './TourInfo.css';

interface TourInfoProps {
  tour: any; // Тип тура должен быть определен более точно
}

const TourInfo: React.FC<TourInfoProps> = ({ tour }) => {
  const [activeTab, setActiveTab] = useState('description');
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  
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
                  {Array.from({ length: tour.hotel.stars }, (_, index) => (
                    <i key={index} className="fa fa-star"></i>
                  ))}
                </div>
                <p>{tour.hotel.description}</p>
                <h5>Удобства</h5>
                <ul className="hotel-amenities">
                  {tour.hotel.amenities?.map((amenity: string, index: number) => (
                    <li key={index}>{amenity}</li>
                  ))}
                </ul>
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
                  {tour.included?.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              
              <div className="included-column">
                <h4>Дополнительно оплачивается:</h4>
                <ul className="excluded-list">
                  {tour.excluded?.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TourInfo; 