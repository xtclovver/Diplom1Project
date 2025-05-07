import React, { useState, useEffect } from 'react';
// Используем настроенный экземпляр api из сервисов
import api from '../../services/api'; // Убедитесь, что путь корректен
import './TourFilter.css';

// Типы данных для фильтрации туров
export interface TourFilters { // Добавляем export
  countryId?: number; // Изменено на одиночный ID
  cityId?: number;    // Изменено на одиночный ID
  priceMin?: number;
  priceMax?: number;
  dateFrom?: string; // Соответствует startDateAfter в API
  dateTo?: string;   // Соответствует startDateBefore в API
  durationMin?: number; // Новое поле
  durationMax?: number; // Новое поле
  peopleCount?: number; // Оставляем, но бэкенд пока не фильтрует
  searchQuery?: string;
  sortBy?: string;      // Новое поле для сортировки (e.g., 'price', 'duration', 'name')
  sortOrder?: 'asc' | 'desc'; // Новое поле для порядка сортировки
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
  // Инициализируем состояние с initialFilters и новыми полями
  const [filters, setFilters] = useState<TourFilters>({
    countryId: initialFilters.countryId || undefined, // Используем undefined для пустого значения
    cityId: initialFilters.cityId || undefined,       // Используем undefined для пустого значения
    dateFrom: initialFilters.dateFrom || '',
    dateTo: initialFilters.dateTo || '',
    peopleCount: initialFilters.peopleCount || 1,
    priceMin: initialFilters.priceMin || undefined,
    priceMax: initialFilters.priceMax || undefined,
    searchQuery: initialFilters.searchQuery || '',
    durationMin: initialFilters.durationMin || undefined, // Новое поле
    durationMax: initialFilters.durationMax || undefined, // Новое поле
    sortBy: initialFilters.sortBy || 'price', // Сортировка по умолчанию - цена
    sortOrder: initialFilters.sortOrder || 'asc' // Порядок по умолчанию - asc
  });

  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Получаем список стран из API
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoading(true);
        const response = await api.get('/countries'); // Используем api и относительный путь
        // Проверяем, является ли ответ массивом
        if (Array.isArray(response.data)) {
          setCountries(response.data);
        } else {
          console.error('Error fetching countries: API response is not an array', response.data);
          setCountries([]); // Устанавливаем пустой массив при некорректном формате ответа
        }
      } catch (err) {
        console.error('Error fetching countries:', err);
        setCountries([]); // Устанавливаем пустой массив при ошибке
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  // Получаем список городов при изменении выбранной страны (теперь одна страна)
  useEffect(() => {
    const fetchCities = async () => {
      try {
        if (filters.countryId) { // Проверяем наличие countryId
          setLoading(true);
          // Запрашиваем города для одной страны
          const response = await api.get(`/countries/${filters.countryId}/cities`); // Используем api и относительный путь
          // Предполагаем, что API вернет массив городов для указанной страны
          if (Array.isArray(response.data)) {
            setCities(response.data);
          } else {
             console.error('Error fetching cities: API response is not an array', response.data);
             setCities([]);
          }
        } else {
          setCities([]); // Если страна не выбрана, очищаем список городов
        }
      } catch (err) {
        console.error('Error fetching cities:', err);
        setCities([]); // Устанавливаем пустой массив при ошибке
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, [filters.countryId]); // Зависимость теперь от countryId

  // Обработчики изменения полей формы
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value);
    setFilters(prev => ({
      ...prev,
      countryId: selectedId || undefined, // Устанавливаем ID или undefined, если выбрано "Все страны"
      cityId: undefined // Сбрасываем выбранный город при смене страны
    }));
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
     const selectedId = parseInt(e.target.value);
    setFilters(prev => ({
      ...prev,
      cityId: selectedId || undefined // Устанавливаем ID или undefined, если выбрано "Все города"
    }));
  };

  // Обновленный обработчик для всех input и select
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Преобразуем значения в нужный тип
    if (name === 'priceMin' || name === 'priceMax' || name === 'peopleCount' || name === 'durationMin' || name === 'durationMax') {
      setFilters(prev => ({
        ...prev,
        [name]: value ? parseInt(value) : undefined
      }));
    } else if (name === 'sortOrder') {
       // Убедимся, что значение sortOrder соответствует типу
       const orderValue = value === 'asc' || value === 'desc' ? value : 'asc';
       setFilters(prev => ({ ...prev, [name]: orderValue }));
    } else {
       // Для остальных полей (searchQuery, dateFrom, dateTo, sortBy)
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Перед отправкой можно удалить пустые/неопределенные значения, если API этого требует
    const cleanFilters = Object.entries(filters).reduce((acc, [key, val]) => {
      if (val !== undefined && val !== '') {
        acc[key as keyof TourFilters] = val;
      }
      return acc;
    }, {} as TourFilters);
    onFilterChange(cleanFilters);
  };

  const handleReset = () => {
    const resetFilters: TourFilters = { // Используем тип для автодополнения
      countryId: undefined,
      cityId: undefined,
      dateFrom: '',
      dateTo: '',
      peopleCount: 1,
      priceMin: undefined,
      priceMax: undefined,
      searchQuery: '',
      durationMin: undefined,
      durationMax: undefined,
      sortBy: 'price', // Сброс к значениям по умолчанию
      sortOrder: 'asc'
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters); // Отправляем сброшенные фильтры
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
            name="countryId" // Изменено имя
            value={filters.countryId || ''} // Значение - ID или пустая строка
            onChange={handleCountryChange} // Используем обновленный обработчик
            disabled={loading}
          >
             <option value="">Все страны</option> {/* Опция для сброса */}
            {Array.isArray(countries) && countries.map(country => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
          {/* Убрали multiple и подсказку */}
        </div>

        <div className="filter-group">
          <label htmlFor="cities">Город</label>
          <select
            id="cities"
            name="cityId" // Изменено имя
            value={filters.cityId || ''} // Значение - ID или пустая строка
            onChange={handleCityChange} // Используем обновленный обработчик
            disabled={loading || !filters.countryId} // Деактивируем, если страна не выбрана
          >
            <option value="">Все города</option> {/* Опция для сброса */}
            {Array.isArray(cities) && cities.map(city => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
           {/* Убрали multiple и подсказку */}
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

        {/* Блок фильтрации по продолжительности */}
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="durationMin">Длительность от (дней)</label>
            <input
              type="number"
              id="durationMin"
              name="durationMin"
              placeholder="1"
              value={filters.durationMin || ''}
              onChange={handleInputChange}
              min="1"
            />
          </div>
          <div className="filter-group">
            <label htmlFor="durationMax">до</label>
            <input
              type="number"
              id="durationMax"
              name="durationMax"
              placeholder="30"
              value={filters.durationMax || ''}
              onChange={handleInputChange}
              min={filters.durationMin || 1}
            />
          </div>
        </div>

         {/* Блок сортировки */}
         <div className="filter-row">
            <div className="filter-group">
                <label htmlFor="sortBy">Сортировать по</label>
                <select
                    id="sortBy"
                    name="sortBy"
                    value={filters.sortBy || 'price'}
                    onChange={handleInputChange}
                >
                    <option value="price">Цене</option>
                    <option value="duration">Продолжительности</option>
                    <option value="name">Названию</option>
                    {/* Добавьте другие опции, если бэкенд их поддерживает */}
                </select>
            </div>
             <div className="filter-group">
                <label htmlFor="sortOrder">Порядок</label>
                <select
                    id="sortOrder"
                    name="sortOrder"
                    value={filters.sortOrder || 'asc'}
                    onChange={handleInputChange}
                >
                    <option value="asc">Возрастанию</option>
                    <option value="desc">Убыванию</option>
                </select>
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