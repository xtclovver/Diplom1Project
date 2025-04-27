import React from 'react';
import './TourDateSelector.css';

interface TourDate {
  id: number;
  tourId: number;
  startDate: string;
  endDate: string;
  availability: number; // Доступное количество мест
  priceModifier: number; // Модификатор цены для сезонов
}

interface TourDateSelectorProps {
  dates: TourDate[];
  onSelect: (date: TourDate) => void;
  selected: TourDate | null;
  basePrice: number; // Базовая цена тура
  loading?: boolean;
}

const TourDateSelector: React.FC<TourDateSelectorProps> = ({ 
  dates, 
  onSelect, 
  selected,
  basePrice,
  loading 
}) => {
  if (loading) {
    return (
      <div className="tour-date-selector">
        <div className="date-selector-header">Выберите дату поездки</div>
        <div className="loading-dates">
          <div className="spinner"></div>
          <p>Загрузка доступных дат...</p>
        </div>
      </div>
    );
  }

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

  // Рассчитываем финальную цену с учетом модификатора
  const calculatePrice = (basePrice: number, modifier: number): number => {
    return Math.round(basePrice * modifier);
  };

  return (
    <div className="tour-date-selector">
      <div className="date-selector-header">Выберите дату поездки</div>
      <div className="date-selector-list">
        {dates.map((date) => (
          <div 
            key={date.id}
            className={`date-option ${selected?.id === date.id ? 'selected' : ''} ${date.availability <= 0 ? 'disabled' : ''}`}
            onClick={() => date.availability > 0 && onSelect(date)}
          >
            <div className="date-range">
              {formatDate(date.startDate)} - {formatDate(date.endDate)}
            </div>
            <div className="date-details">
              <span className="date-price">
                {calculatePrice(basePrice, date.priceModifier).toLocaleString()} ₽
              </span>
              <span className={`date-seats ${date.availability <= 3 ? 'low' : ''}`}>
                {date.availability > 0
                  ? `Осталось мест: ${date.availability}`
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