import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFilters, clearFilters } from '../../store/tour/tourSlice';
import './TourFilter.css';

const TourFilter = () => {
  const dispatch = useDispatch();
  const { filters } = useSelector(state => state.tour);
  
  // Локальное состояние для формы
  const [localFilters, setLocalFilters] = useState(filters);
  
  // Обновляем локальное состояние при изменении глобальных фильтров
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);
  
  // Обработчик изменения полей фильтра
  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters({
      ...localFilters,
      [name]: value
    });
  };
  
  // Обработчик отправки формы
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(setFilters(localFilters));
  };
  
  // Обработчик сброса фильтров
  const handleReset = () => {
    dispatch(clearFilters());
  };
  
  return (
    <div className="tour-filter">
      <h3 className="tour-filter__title">Фильтр туров</h3>
      <form className="tour-filter__form" onSubmit={handleSubmit}>
        <div className="tour-filter__row">
          <div className="tour-filter__group">
            <label htmlFor="country" className="tour-filter__label">Страна</label>
            <input
              type="text"
              id="country"
              name="country"
              className="tour-filter__input"
              value={localFilters.country}
              onChange={handleChange}
              placeholder="Любая страна"
            />
          </div>
          <div className="tour-filter__group">
            <label htmlFor="city" className="tour-filter__label">Город</label>
            <input
              type="text"
              id="city"
              name="city"
              className="tour-filter__input"
              value={localFilters.city}
              onChange={handleChange}
              placeholder="Любой город"
            />
          </div>
        </div>
        
        <div className="tour-filter__row">
          <div className="tour-filter__group">
            <label htmlFor="dateFrom" className="tour-filter__label">Дата начала</label>
            <input
              type="date"
              id="dateFrom"
              name="dateFrom"
              className="tour-filter__input"
              value={localFilters.dateFrom}
              onChange={handleChange}
            />
          </div>
          <div className="tour-filter__group">
            <label htmlFor="dateTo" className="tour-filter__label">Дата окончания</label>
            <input
              type="date"
              id="dateTo"
              name="dateTo"
              className="tour-filter__input"
              value={localFilters.dateTo}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="tour-filter__row">
          <div className="tour-filter__group">
            <label htmlFor="people" className="tour-filter__label">Количество человек</label>
            <input
              type="number"
              id="people"
              name="people"
              className="tour-filter__input"
              value={localFilters.people}
              onChange={handleChange}
              min="1"
              max="10"
            />
          </div>
        </div>
        
        <div className="tour-filter__row">
          <div className="tour-filter__group">
            <label htmlFor="priceMin" className="tour-filter__label">Цена от</label>
            <input
              type="number"
              id="priceMin"
              name="priceMin"
              className="tour-filter__input"
              value={localFilters.priceMin}
              onChange={handleChange}
              placeholder="Мин. цена"
              min="0"
            />
          </div>
          <div className="tour-filter__group">
            <label htmlFor="priceMax" className="tour-filter__label">Цена до</label>
            <input
              type="number"
              id="priceMax"
              name="priceMax"
              className="tour-filter__input"
              value={localFilters.priceMax}
              onChange={handleChange}
              placeholder="Макс. цена"
              min="0"
            />
          </div>
        </div>
        
        <div className="tour-filter__buttons">
          <button type="submit" className="tour-filter__submit">Применить фильтры</button>
          <button type="button" className="tour-filter__reset" onClick={handleReset}>Сбросить</button>
        </div>
      </form>
    </div>
  );
};

export default TourFilter; 