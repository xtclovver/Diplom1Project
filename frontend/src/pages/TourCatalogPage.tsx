import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchTours, setFilters, setPage, setPageSize } from '../store/tours/toursSlice';
import TourFilter from '../components/tour/TourFilter';
import TourList from '../components/tour/TourList';
import Pagination from '../components/ui/Pagination';
import Spinner from '../components/ui/Spinner';
import SortSelector from '../components/ui/SortSelector';
import './TourCatalogPage.css';

// Определение типов в соответствии с TourList.tsx
interface Tour {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  basePrice: number;
  duration: number;
  city: {
    id: number;
    name: string;
    country: {
      id: number;
      name: string;
    };
  };
}

// Используем интерфейс TourFilters из TourFilter.tsx для компонента фильтра
interface FilterComponentFilters {
  country?: string;
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  people?: number;
  priceMin?: string;
  priceMax?: string;
}

// Интерфейс для фильтров в Redux store
interface ReduxTourFilters {
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

// Интерфейс ToursState из toursSlice.ts
interface ToursState {
  tours: Tour[];
  tour: any;
  tourDates: any[];
  filters: ReduxTourFilters;
  pagination: {
    page: number;
    size: number;
    total: number;
  };
  loading: boolean;
  error: string | null;
}

const TourCatalogPage: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Используем правильный типизированный хук, и задаем дефолтные значения при их отсутствии
  const toursState = useAppSelector(state => state.tours);
  
  // Берем данные из состояния с проверками на undefined
  const tours = toursState?.tours || [];
  const loading = toursState?.loading || false;
  const error = toursState?.error || null;
  const filters = toursState?.filters || {};
  const pagination = toursState?.pagination || { page: 1, size: 10, total: 0 };
  
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    if (toursState) {
      // Вызываем fetchTours только если store уже инициализирован
      dispatch(fetchTours({ filters, page: pagination.page, size: pagination.size }));
    }
  }, [dispatch, filters, pagination.page, pagination.size, toursState]);

  const handleFilterChange = (newFilters: FilterComponentFilters) => {
    // Преобразуем фильтры из компонента в формат для Redux store
    const reduxFilters: ReduxTourFilters = {
      countries: newFilters.country ? [Number(newFilters.country)] : undefined,
      cities: newFilters.city ? [Number(newFilters.city)] : undefined,
      priceMin: newFilters.priceMin ? Number(newFilters.priceMin) : undefined,
      priceMax: newFilters.priceMax ? Number(newFilters.priceMax) : undefined,
      dateFrom: newFilters.dateFrom,
      dateTo: newFilters.dateTo,
      peopleCount: newFilters.people
    };
    
    dispatch(setFilters(reduxFilters));
  };

  const handlePageChange = (page: number) => {
    dispatch(setPage(page));
  };

  const handleSizeChange = (size: number) => {
    dispatch(setPageSize(size));
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
  };

  // Сортировка туров
  const sortedTours = [...tours].sort((a, b) => {
    if (sortBy === 'price-asc') return a.basePrice - b.basePrice;
    if (sortBy === 'price-desc') return b.basePrice - a.basePrice;
    if (sortBy === 'popular') return 0; // Реализовать когда появится данные о популярности
    return 0;
  });

  if (error) {
    return <div className="error-message">Ошибка: {error}</div>;
  }

  // Преобразуем фильтры из Redux store в формат для компонента TourFilter
  const filterForComponent: FilterComponentFilters = {
    country: filters.countries && filters.countries.length > 0 ? String(filters.countries[0]) : '',
    city: filters.cities && filters.cities.length > 0 ? String(filters.cities[0]) : '',
    dateFrom: filters.dateFrom || '',
    dateTo: filters.dateTo || '',
    people: filters.peopleCount || 1,
    priceMin: filters.priceMin ? String(filters.priceMin) : '',
    priceMax: filters.priceMax ? String(filters.priceMax) : ''
  };

  return (
    <div className="tour-catalog-page">
      <h1>Каталог туров</h1>
      
      <div className="catalog-container">
        <div className="filter-panel">
          <TourFilter onFilterChange={handleFilterChange as any} initialFilters={filterForComponent as any} />
        </div>
        
        <div className="tour-results">
          <div className="results-header">
            <div className="results-count">
              Найдено туров: {pagination.total}
            </div>
            
            <div className="sort-selector">
              <SortSelector 
                value={sortBy} 
                onChange={handleSortChange} 
                options={[
                  { value: 'popular', label: 'По популярности' },
                  { value: 'price-asc', label: 'От дешевых к дорогим' },
                  { value: 'price-desc', label: 'От дорогих к дешевым' }
                ]} 
              />
            </div>
          </div>
          
          {loading ? (
            <Spinner />
          ) : (
            <>
              <TourList tours={sortedTours as any} />
              
              <div className="pagination-container">
                <Pagination 
                  currentPage={pagination.page} 
                  totalPages={Math.ceil(pagination.total / pagination.size)} 
                  onPageChange={handlePageChange} 
                  pageSize={pagination.size}
                  onPageSizeChange={handleSizeChange}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TourCatalogPage; 