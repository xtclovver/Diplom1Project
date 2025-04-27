import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TourFilter.css';

// Типы данных для фильтрации туров
interface TourFilters {
  countries?: number[];
  cities?: number[];
  priceMin?: number;
  priceMax?: number;
  dateFrom?: string;
  dateTo?: string;
  duration?: number[];
  peopleCount?: number;
  searchQuery?: string;
}

interface Country {
  id: number;
  name: string;
  code: string;
}

interface City {
  id: number;
  name: string;
  countryId: number;
}

interface FilterProps {
  onFilterChange: (filters: TourFilters) => void;
  initialFilters: TourFilters;
}

const TourFilter: React.FC<FilterProps> = ({ onFilterChange, initialFilters }) => {
  // Инициализируем состояние с initialFilters
  const [filters, setFilters] = useState<TourFilters>({
    countries: initialFilters.countries || [],
    cities: initialFilters.cities || [],
    dateFrom: initialFilters.dateFrom || '',
    dateTo: initialFilters.dateTo || '',
    peopleCount: initialFilters.peopleCount || 1,
    priceMin: initialFilters.priceMin || undefined,
    priceMax: initialFilters.priceMax || undefined,
    searchQuery: initialFilters.searchQuery || '',
    duration: initialFilters.duration || []
  });
  
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Получаем список стран из API
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/countries');
        setCountries(response.data);
      } catch (err) {
        console.error('Error fetching countries:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCountries();
  }, []);
  
  // Получаем список городов при изменении выбранной страны
  useEffect(() => {
    const fetchCities = async () => {
      try {
        if (filters.countries && filters.countries.length > 0) {
          setLoading(true);
          const response = await axios.get('/api/cities', {
            params: { countryIds: filters.countries.join(',') }
          });
          setCities(response.data);
        } else {
          setCities([]);
        }
      } catch (err) {
        console.error('Error fetching cities:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCities();
  }, [filters.countries]);
  
  // Обработчики изменения полей формы
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
    setFilters(prev => ({
      ...prev,
      countries: selectedOptions,
      cities: [] // Сбрасываем выбранные города при смене страны
    }));
  };
  
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
    setFilters(prev => ({
      ...prev,
      cities: selectedOptions
    }));
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Преобразуем значения в нужный тип
    if (name === 'priceMin' || name === 'priceMax' || name === 'peopleCount') {
      setFilters(prev => ({
        ...prev,
        [name]: value ? parseInt(value) : undefined
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange(filters);
  };
  
  const handleReset = () => {
    const resetFilters = {
      countries: [],
      cities: [],
      dateFrom: '',
      dateTo: '',
      peopleCount: 1,
      priceMin: undefined,
      priceMax: undefined,
      searchQuery: '',
      duration: []
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };
  
  return (
    <div className="tour-filter">
      <h3>Поиск и фильтры</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="filter-group search-group">
          <label htmlFor="searchQuery">Поиск по названию</label>
          <input 
            type="text" 
            id="searchQuery" 
            name="searchQuery" 
            placeholder="Введите название тура" 
            value={filters.searchQuery || ''} 
            onChange={handleInputChange}
          />
        </div>
        
        <div className="filter-group">
          <label htmlFor="countries">Страна</label>
          <select 
            id="countries" 
            name="countries" 
            multiple 
            value={filters.countries?.map(String) || []} 
            onChange={handleCountryChange}
            disabled={loading}
          >
            {countries.map(country => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
          <small className="help-text">Для выбора нескольких стран удерживайте Ctrl</small>
        </div>
        
        <div className="filter-group">
          <label htmlFor="cities">Город</label>
          <select 
            id="cities" 
            name="cities" 
            multiple 
            value={filters.cities?.map(String) || []} 
            onChange={handleCityChange}
            disabled={loading || !filters.countries || filters.countries.length === 0}
          >
            {cities.map(city => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
          <small className="help-text">Для выбора нескольких городов удерживайте Ctrl</small>
        </div>
        
        <div className="filter-group">
          <label htmlFor="dateFrom">Дата начала поездки</label>
          <input 
            type="date" 
            id="dateFrom" 
            name="dateFrom" 
            value={filters.dateFrom || ''} 
            onChange={handleInputChange}
            min={new Date().toISOString().split('T')[0]} // Минимальная дата - сегодня
          />
        </div>
        
        <div className="filter-group">
          <label htmlFor="dateTo">Дата окончания поездки</label>
          <input 
            type="date" 
            id="dateTo" 
            name="dateTo" 
            value={filters.dateTo || ''} 
            onChange={handleInputChange}
            min={filters.dateFrom || new Date().toISOString().split('T')[0]} // Минимальная дата - дата начала или сегодня
          />
        </div>
        
        <div className="filter-group">
          <label htmlFor="peopleCount">Количество человек</label>
          <input 
            type="number" 
            id="peopleCount" 
            name="peopleCount" 
            min="1" 
            max="10" 
            value={filters.peopleCount || 1} 
            onChange={handleInputChange}
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
              value={filters.priceMin || ''} 
              onChange={handleInputChange}
              min="0"
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="priceMax">до</label>
            <input 
              type="number" 
              id="priceMax" 
              name="priceMax" 
              placeholder="∞" 
              value={filters.priceMax || ''} 
              onChange={handleInputChange}
              min={filters.priceMin || 0}
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