import React from 'react';
import './SortSelector.css';

interface SortOption {
  value: string;
  label: string;
}

interface SortSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: SortOption[];
}

const SortSelector: React.FC<SortSelectorProps> = ({ value, onChange, options }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="sort-selector-container">
      <label>
        Сортировать по:
        <select value={value} onChange={handleChange}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};

export default SortSelector; 