import React from 'react';
import './OrderFilter.css';

interface OrderFilterProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const OrderFilter: React.FC<OrderFilterProps> = ({ activeFilter, onFilterChange }) => {
  const filters = [
    { id: 'all', label: 'Все заказы' },
    { id: 'active', label: 'Активные' },
    { id: 'completed', label: 'Завершенные' },
    { id: 'cancelled', label: 'Отмененные' }
  ];
  
  return (
    <div className="order-filter">
      <h3>Фильтр заказов</h3>
      
      <div className="filter-options">
        {filters.map(filter => (
          <button
            key={filter.id}
            className={`filter-option ${activeFilter === filter.id ? 'active' : ''}`}
            onClick={() => onFilterChange(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default OrderFilter; 