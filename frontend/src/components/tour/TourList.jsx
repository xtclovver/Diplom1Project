import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchTours, setPage } from '../../store/tour/tourSlice';
import TourFilter from './TourFilter';
import './TourList.css';

const TourList = () => {
  const dispatch = useDispatch();
  const { tours, loading, error, filters, pagination } = useSelector(state => state.tour);
  
  // Загрузка туров при монтировании компонента и изменении фильтров или страницы
  useEffect(() => {
    dispatch(fetchTours({
      filters,
      page: pagination.page,
      size: pagination.size
    }));
  }, [dispatch, filters, pagination.page, pagination.size]);
  
  // Обработчик изменения страницы
  const handlePageChange = (newPage) => {
    dispatch(setPage(newPage));
  };
  
  // Компонент загрузки
  if (loading) {
    return (
      <div className="tour-list-loading">
        <p>Загрузка туров...</p>
      </div>
    );
  }
  
  // Компонент ошибки
  if (error) {
    return (
      <div className="tour-list-error">
        <p>Ошибка: {error}</p>
        <button onClick={() => dispatch(fetchTours({ filters, page: pagination.page, size: pagination.size }))}>
          Попробовать снова
        </button>
      </div>
    );
  }
  
  // Вычисляем номера страниц для пагинации
  const totalPages = Math.ceil(pagination.total / pagination.size);
  const pages = [];
  
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }
  
  return (
    <div className="tour-list-container">
      <div className="tour-list-sidebar">
        <TourFilter />
      </div>
      
      <div className="tour-list-content">
        <h2 className="tour-list-title">Доступные туры</h2>
        
        {tours.length === 0 ? (
          <div className="tour-list-empty">
            <p>Туры не найдены. Попробуйте изменить параметры фильтрации.</p>
          </div>
        ) : (
          <>
            <div className="tour-list">
              {tours.map(tour => (
                <div key={tour.id} className="tour-card">
                  <div className="tour-card__image">
                    <img src={tour.imageUrl || '/img/tour-placeholder.jpg'} alt={tour.name} />
                  </div>
                  <div className="tour-card__content">
                    <h3 className="tour-card__title">{tour.name}</h3>
                    <p className="tour-card__location">{tour.city}, {tour.country}</p>
                    <p className="tour-card__duration">Продолжительность: {tour.duration} {getDurationText(tour.duration)}</p>
                    <p className="tour-card__price">от {tour.basePrice.toLocaleString()} ₽</p>
                    <Link to={`/tours/${tour.id}`} className="tour-card__link">Подробнее</Link>
                  </div>
                </div>
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="tour-list-pagination">
                <button
                  className="pagination-prev"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Назад
                </button>
                
                <div className="pagination-pages">
                  {pages.map(page => (
                    <button
                      key={page}
                      className={`pagination-page ${pagination.page === page ? 'active' : ''}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  className="pagination-next"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === totalPages}
                >
                  Вперед
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Вспомогательная функция для склонения слова "дни"
const getDurationText = (duration) => {
  const lastDigit = duration % 10;
  const lastTwoDigits = duration % 100;
  
  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return 'день';
  } else if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwoDigits)) {
    return 'дня';
  } else {
    return 'дней';
  }
};

export default TourList; 