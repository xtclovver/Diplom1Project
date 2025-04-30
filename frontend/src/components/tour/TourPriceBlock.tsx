import React from 'react';
import { Button } from '../ui/Button';
import './TourPriceBlock.css';
import { ITour } from '../../store/tours/types';
import { ITourDate } from '../../store/tour/types';

interface TourPriceBlockProps {
  tour: ITour;
  selectedDate: ITourDate | null;
  onBookClick: () => void;
  onDateSelectorClick: () => void;
}

const TourPriceBlock: React.FC<TourPriceBlockProps> = ({
  tour,
  selectedDate,
  onBookClick,
  onDateSelectorClick
}) => {
  // Функция для расчета окончательной цены с учетом модификатора
  const calculateFinalPrice = (): number => {
    if (!tour || typeof tour.price !== 'number' || tour.price < 0) {
      return 0;
    }
    
    // Если дата не выбрана или у нее нет модификатора цены, возвращаем базовую цену
    if (!selectedDate || typeof selectedDate.priceModifier !== 'number' || selectedDate.priceModifier <= 0) {
      return tour.price;
    }
    
    return Math.round(tour.price * selectedDate.priceModifier);
  };

  // Форматирование цены для отображения
  const formatPrice = (price: number): string => {
    if (isNaN(price) || price < 0) return '0';
    return price.toLocaleString('ru-RU');
  };

  // Получаем базовую цену тура
  const basePrice = tour?.price || 0;
  // Получаем окончательную цену
  const finalPrice = calculateFinalPrice();

  return (
    <div className="tour-price-block">
      <div className="price-info">
        <div className="price-label">Стоимость тура:</div>
        <div className="price-value">
          {formatPrice(finalPrice)} <span className="currency">₽</span>
        </div>
        
        {/* Показываем базовую цену, если есть модификатор и финальная цена отличается */}
        {selectedDate && selectedDate.priceModifier !== 1 && basePrice > 0 && finalPrice !== basePrice && (
          <div className="base-price">
            Базовая цена: {formatPrice(basePrice)} ₽
          </div>
        )}
      </div>
      
      <div className="price-actions">
        {selectedDate ? (
          <Button 
            variant="primary" 
            fullWidth 
            onClick={onBookClick}
            disabled={finalPrice <= 0 || (selectedDate && selectedDate.availability <= 0)}
          >
            Забронировать
          </Button>
        ) : (
          <Button 
            variant="secondary" 
            fullWidth 
            onClick={onDateSelectorClick}
          >
            Выбрать дату
          </Button>
        )}
      </div>
      
      {selectedDate && (
        <div className="date-info">
          <p>
            <strong>Период:</strong>{' '}
            {selectedDate.startDate && new Date(selectedDate.startDate).toLocaleDateString('ru-RU')} - {' '}
            {selectedDate.endDate && new Date(selectedDate.endDate).toLocaleDateString('ru-RU')}
          </p>
          <p>
            <strong>Мест осталось:</strong>{' '}
            {typeof selectedDate.availability === 'number' 
              ? (selectedDate.availability > 0 
                ? selectedDate.availability 
                : 'Нет мест') 
              : 'Неизвестно'}
          </p>
        </div>
      )}
    </div>
  );
};

export default TourPriceBlock; 