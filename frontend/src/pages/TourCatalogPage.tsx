import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../store/hooks';
import { fetchTours, setFilters, setPage, setSize, Tour as TourType, TourFilters } from '../store/tour/tourSlice';
import TourFilter from '../components/tour/TourFilter';
import TourList from '../components/tour/TourList';
import Pagination from '../components/ui/Pagination';
import Spinner from '../components/ui/Spinner';
import SortSelector from '../components/ui/SortSelector';
import { RootState } from '../store';
import './TourCatalogPage.css';

const TourCatalogPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tours, loading, error, filters, pagination } = useSelector((state: RootState) => state.tour);
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    // Вызываем fetchTours напрямую
    dispatch(fetchTours({ filters, page: pagination.page, size: pagination.size }));
  }, [dispatch, filters, pagination.page, pagination.size]);

  const handleFilterChange = (newFilters: TourFilters) => {
    dispatch(setFilters(newFilters));
  };

  const handlePageChange = (page: number) => {
    dispatch(setPage(page));
  };

  const handleSizeChange = (size: number) => {
    dispatch(setSize(size));
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
  };

  // Сортировка туров
  const sortedTours = [...tours].sort((a, b) => {
    if (sortBy === 'price-asc') return a.base_price - b.base_price;
    if (sortBy === 'price-desc') return b.base_price - a.base_price;
    if (sortBy === 'popular') return b.popularity - a.popularity;
    return 0;
  });

  if (error) {
    return <div className="error-message">Ошибка: {error}</div>;
  }

  return (
    <div className="tour-catalog-page">
      <h1>Каталог туров</h1>
      
      <div className="catalog-container">
        <div className="filter-panel">
          <TourFilter onFilterChange={handleFilterChange} initialFilters={filters} />
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
              <TourList tours={sortedTours} />
              
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