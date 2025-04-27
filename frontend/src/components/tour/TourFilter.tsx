import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import './TourFilter.css';

// Используем тот же интерфейс, что в tourSlice
interface TourFilters {
  country?: string;
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  people?: number;
  priceMin?: string;
  priceMax?: string;
}

interface FilterProps {
  onFilterChange: (filters: TourFilters) => void;
  initialFilters: TourFilters;
}

const TourFilter: React.FC<FilterProps> = ({ onFilterChange, initialFilters }) => {
  // Инициализируем состояние с initialFilters, устанавливая дефолтные значения для опциональных полей
  const [filters, setFilters] = useState<TourFilters>({
    country: initialFilters.country || '',
    city: initialFilters.city || '',
    dateFrom: initialFilters.dateFrom || '',
    dateTo: initialFilters.dateTo || '',
    people: initialFilters.people || 1,
    priceMin: initialFilters.priceMin || '',
    priceMax: initialFilters.priceMax || ''
  });
  const [countries, setCountries] = useState<{ id: number, name: string }[]>([]);
  const [cities, setCities] = useState<{ id: number, name: string }[]>([]);
  
  // Получаем список стран и городов из API
  useEffect(() => {
    // Здесь должен быть запрос к API для получения списка стран
    // Для примера используем моковые данные
    setCountries([
      { id: 1, name: 'Россия' },
      { id: 2, name: 'Турция' },
      { id: 3, name: 'Египет' },
      { id: 4, name: 'Таиланд' }
    ]);
  }, []);
  
  // При изменении страны получаем список городов
  useEffect(() => {
    if (filters.country) {
      // Здесь должен быть запрос к API для получения списка городов по стране
      // Для примера используем моковые данные
      if (filters.country === '1') {
        setCities([
          { id: 1, name: 'Москва' },
          { id: 2, name: 'Санкт-Петербург' },
          { id: 3, name: 'Сочи' }
        ]);
      } else if (filters.country === '2') {
        setCities([
          { id: 4, name: 'Анталия' },
          { id: 5, name: 'Стамбул' },
          { id: 6, name: 'Алания' }
        ]);
      } else {
        setCities([]);
      }
    } else {
      setCities([]);
    }
  }, [filters.country]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange(filters);
  };
  
  const handleReset = () => {
    setFilters(initialFilters);
    onFilterChange(initialFilters);
  };
  
  return (
    <div className="tour-filter">
      <h3>Фильтры</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="filter-group">
          <label htmlFor="country">Страна</label>
          <select 
            id="country" 
            name="country" 
            value={filters.country} 
            onChange={handleChange}
          >
            <option value="">Все страны</option>
            {countries.map(country => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="city">Город</label>
          <select 
            id="city" 
            name="city" 
            value={filters.city} 
            onChange={handleChange}
            disabled={!filters.country}
          >
            <option value="">Все города</option>
            {cities.map(city => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="dateFrom">Дата начала</label>
          <input 
            type="date" 
            id="dateFrom" 
            name="dateFrom" 
            value={filters.dateFrom} 
            onChange={handleChange}
          />
        </div>
        
        <div className="filter-group">
          <label htmlFor="dateTo">Дата окончания</label>
          <input 
            type="date" 
            id="dateTo" 
            name="dateTo" 
            value={filters.dateTo} 
            onChange={handleChange}
          />
        </div>
        
        <div className="filter-group">
          <label htmlFor="people">Количество человек</label>
          <input 
            type="number" 
            id="people" 
            name="people" 
            min="1" 
            max="10" 
            value={filters.people} 
            onChange={handleChange}
          />
        </div>
        
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="priceMin">Цена от</label>
            <input 
              type="number" 
              id="priceMin" 
              name="priceMin" 
              placeholder="0" 
              value={filters.priceMin} 
              onChange={handleChange}
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="priceMax">до</label>
            <input 
              type="number" 
              id="priceMax" 
              name="priceMax" 
              placeholder="∞" 
              value={filters.priceMax} 
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="filter-actions">
          <button type="submit" className="filter-button primary">
            Применить
          </button>
          <button type="button" className="filter-button" onClick={handleReset}>
            Сбросить
          </button>
        </div>
      </form>
    </div>
  );
};

export default TourFilter; 