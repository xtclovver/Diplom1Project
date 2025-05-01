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
      return "Нет даты";
    }
    
    try {
      // Если дата в формате ISO (строка в формате YYYY-MM-DDTHH:mm:ss.sssZ)
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        // Если не получилось распарсить как ISO, пробуем другие форматы
        
        // Проверяем формат YYYY-MM-DD
        if (dateString.includes('-')) {
          const dateParts = dateString.split("-");
          if (dateParts.length === 3) {
            // Преобразуем в формат ДД.ММ.ГГГГ
            return `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}`;
          }
        } 
        
        // Если дата уже в формате ДД.ММ.ГГГГ
        if (dateString.includes('.')) {
          return dateString;
        }
        
        // Если все проверки не сработали, возвращаем текущую дату
        const currentDate = new Date();
        return currentDate.toLocaleDateString('ru-RU');
      }
      
      // Используем русскую локаль для формата ДД.ММ.ГГГГ
      return date.toLocaleDateString('ru-RU');
    } catch (error) {
      console.error("Ошибка при форматировании даты:", error);
      return "Дата не распознана";
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