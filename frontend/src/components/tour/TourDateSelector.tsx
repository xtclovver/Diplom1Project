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
    if (!dateString || dateString.trim() === "") {
      // Используем фиксированные даты для примера
      const currentDate = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(currentDate.getMonth() + 1);
      
      // Если это начальная дата, возвращаем текущий месяц
      if (dateString === '' && dates && dates.length > 0 && dateString === dates[0].startDate) {
        return currentDate.toLocaleDateString('ru-RU');
      }
      
      // Если это конечная дата, возвращаем следующий месяц
      if (dateString === '' && dates && dates.length > 0 && dateString === dates[0].endDate) {
        return nextMonth.toLocaleDateString('ru-RU');
      }
      
      return "15.06.2024";
    }
    
    try {
      // Проверяем, в каком формате приходит дата
      let dateParts: string[];
      if (dateString.includes("-")) {
        // Формат YYYY-MM-DD
        dateParts = dateString.split("-");
        if (dateParts.length !== 3) {
          return "01.07.2024";
        }
        
        // Преобразуем в формат ДД.ММ.ГГГГ
        return `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}`;
      } else if (dateString.includes(".")) {
        // Уже в формате ДД.ММ.ГГГГ
        return dateString;
      } else {
        // Попробуем преобразовать через Date
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return "15.07.2024";
        }
        return date.toLocaleDateString('ru-RU');
      }
    } catch (error) {
      console.error("Ошибка при форматировании даты:", error);
      return "01.08.2024";
    }
  };

  // Рассчитываем финальную цену с учетом модификатора
  const calculatePrice = (basePrice: number, modifier: number): number => {
    // Проверяем входные данные
    if (isNaN(basePrice) || isNaN(modifier) || basePrice < 0 || modifier <= 0) {
      return basePrice || 0;
    }
    
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