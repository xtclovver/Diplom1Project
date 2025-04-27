import React, { useState } from 'react';
import './OrderForm.css';

interface OrderFormProps {
  orderData: {
    tourId: string;
    tourDateId: number;
    roomId: number | null;
    adults: number;
    children: number;
    specialRequests: string;
    contactPhone: string;
    totalPrice: number;
  };
  onChange: (name: string, value: any) => void;
  onSubmit: () => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ orderData, onChange, onSubmit }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let parsedValue: any = value;
    
    // Для числовых полей преобразуем значение в число
    if (name === 'adults' || name === 'children') {
      parsedValue = parseInt(value, 10);
      // Проверяем на минимальные значения
      if (name === 'adults' && parsedValue < 1) parsedValue = 1;
      if (name === 'children' && parsedValue < 0) parsedValue = 0;
    }
    
    onChange(name, parsedValue);
    
    // Очищаем ошибку при изменении поля
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (orderData.adults < 1) {
      newErrors.adults = 'Необходимо указать минимум 1 взрослого';
    }
    
    if (orderData.contactPhone.trim() === '') {
      newErrors.contactPhone = 'Введите номер телефона для связи';
    } else if (!/^\+?\d{10,15}$/.test(orderData.contactPhone)) {
      newErrors.contactPhone = 'Введите корректный номер телефона';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit();
    }
  };
  
  return (
    <form className="order-form" onSubmit={handleSubmit}>
      <div className="form-section">
        <h3>Информация о туристах</h3>
        
        <div className="form-group">
          <label htmlFor="adults">Количество взрослых</label>
          <input
            type="number"
            id="adults"
            name="adults"
            min="1"
            max="10"
            value={orderData.adults}
            onChange={handleChange}
            className={errors.adults ? 'error' : ''}
          />
          {errors.adults && <div className="error-message">{errors.adults}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="children">Количество детей (до 12 лет)</label>
          <input
            type="number"
            id="children"
            name="children"
            min="0"
            max="10"
            value={orderData.children}
            onChange={handleChange}
          />
        </div>
      </div>
      
      <div className="form-section">
        <h3>Контактная информация</h3>
        
        <div className="form-group">
          <label htmlFor="contactPhone">Контактный телефон</label>
          <input
            type="tel"
            id="contactPhone"
            name="contactPhone"
            placeholder="+7 (999) 123-45-67"
            value={orderData.contactPhone}
            onChange={handleChange}
            className={errors.contactPhone ? 'error' : ''}
          />
          {errors.contactPhone && <div className="error-message">{errors.contactPhone}</div>}
        </div>
      </div>
      
      <div className="form-section">
        <h3>Дополнительная информация</h3>
        
        <div className="form-group">
          <label htmlFor="specialRequests">Особые пожелания</label>
          <textarea
            id="specialRequests"
            name="specialRequests"
            rows={4}
            placeholder="Укажите особые пожелания к поездке, если есть"
            value={orderData.specialRequests}
            onChange={handleChange}
          ></textarea>
        </div>
      </div>
      
      <div className="form-actions">
        <button type="submit" className="form-submit-button">
          Перейти к подтверждению
        </button>
      </div>
    </form>
  );
};

export default OrderForm; 