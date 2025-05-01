import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchTours, setFilters, setPage, setPageSize } from '../store/tours/toursSlice';
import TourFilter from '../components/tour/TourFilter';
import { TourFilters } from '../components/tour/TourFilter';
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
  
  // Убираем локальное состояние сортировки, она будет управляться через Redux filters

  useEffect(() => {
    // Передаем все фильтры (включая сортировку) и пагинацию в fetchTours
    // Убедитесь, что fetchTours и API используют эти параметры
    dispatch(fetchTours({ filters, page: pagination.page, size: pagination.size }));
  }, [dispatch, filters, pagination.page, pagination.size]); // Зависимость от всего объекта filters

  // Обработчик принимает напрямую объект TourFilters
  const handleFilterChange = (newFilters: TourFilters) => {
    // Сбрасываем страницу на 1 при изменении фильтров
    dispatch(setPage(1));
    // Отправляем новые фильтры в Redux store без преобразований
    dispatch(setFilters(newFilters));
  };

  const handlePageChange = (page: number) => {
    dispatch(setPage(page));
  };

  const handleSizeChange = (size: number) => {
    dispatch(setPageSize(size));
  };

  // Убираем локальный обработчик сортировки

  // Убираем локальную сортировку, данные должны приходить отсортированными с бэкенда
  // const sortedTours = [...tours].sort(...);

  if (error) {
    return <div className="error-message">Ошибка: {error}</div>;
  }

  // Передаем фильтры из Redux store напрямую в TourFilter,
  // так как теперь используется единый тип TourFilters.
  // Убедитесь, что начальное состояние filters в Redux соответствует TourFilters.
  const initialFiltersForComponent: TourFilters = filters;

  return (
    <div className="tour-catalog-page">
      <h1>Каталог туров</h1>

      <div className="catalog-container">
        <div className="filter-panel">
          {/* Передаем обработчик и начальные фильтры без 'as any' */}
          <TourFilter
            onFilterChange={handleFilterChange}
            initialFilters={initialFiltersForComponent}
          />
        </div>

        <div className="tour-results">
          <div className="results-header">
            <div className="results-count">
              Найдено туров: {pagination.total}
            </div>

            {/* Убираем SortSelector, так как сортировка теперь часть TourFilter */}
            {/* <div className="sort-selector"> ... </div> */}
          </div>

          {loading ? (
            <Spinner />
          ) : (
            <>
              {/* Передаем туры напрямую без локальной сортировки и 'as any' */}
              <TourList tours={tours} />

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