import React from 'react';
import './TourDateSelector.css';

interface TourDate {
  id: number;
  start_date: string;
  end_date: string;
  available_seats: number;
  price: number;
}

interface TourDateSelectorProps {
  dates: TourDate[];
  onSelect: (date: TourDate) => void;
  selected: TourDate | null;
}

const TourDateSelector: React.FC<TourDateSelectorProps> = ({ 
  dates, 
  onSelect, 
  selected 
}) => {
  if (!dates || dates.length === 0) {
    return (
      <div className="tour-date-selector">
        <div className="date-selector-header">Выберите дату поездки</div>
        <div className="no-dates">
          <p>К сожалению, на текущий момент нет доступных дат для данного тура.</p>
        </div>
      </div>
    );
  }

  // Форматирование даты в формат "ДД.ММ.ГГГГ"
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <div className="tour-date-selector">
      <div className="date-selector-header">Выберите дату поездки</div>
      <div className="date-selector-list">
        {dates.map((date) => (
          <div 
            key={date.id}
            className={`date-option ${selected?.id === date.id ? 'selected' : ''} ${date.available_seats <= 0 ? 'disabled' : ''}`}
            onClick={() => date.available_seats > 0 && onSelect(date)}
          >
            <div className="date-range">
              {formatDate(date.start_date)} - {formatDate(date.end_date)}
            </div>
            <div className="date-details">
              <span className="date-price">
                {date.price.toLocaleString()} ₽
              </span>
              <span className={`date-seats ${date.available_seats <= 3 ? 'low' : ''}`}>
                {date.available_seats > 0
                  ? `Осталось мест: ${date.available_seats}`
                  : 'Нет мест'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TourDateSelector; 