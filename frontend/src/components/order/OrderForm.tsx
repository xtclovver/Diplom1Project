import React, { useState } from 'react';
import './OrderForm.css';

interface OrderFormProps {
  bookingData: {
    tourId: string;
    tourDateId: number;
    roomId: number | null;
    peopleCount: number;
    totalPrice: number;
    contactPhone?: string;
    specialRequests?: string;
    email?: string;
  };
  onChange: (name: string, value: any) => void;
  onSubmit: () => void;
  loading?: boolean;
}

const OrderForm: React.FC<OrderFormProps> = ({ bookingData, onChange, onSubmit, loading }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let parsedValue: any = value;
    
    // Для числовых полей преобразуем значение в число
    if (name === 'peopleCount') {
      parsedValue = parseInt(value, 10);
      // Проверяем на минимальные значения
      if (parsedValue < 1) parsedValue = 1;
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
    
    if (bookingData.peopleCount < 1) {
      newErrors.peopleCount = 'Необходимо указать минимум 1 человека';
    }
    
    if (!bookingData.contactPhone || bookingData.contactPhone.trim() === '') {
      newErrors.contactPhone = 'Введите номер телефона для связи';
    } else if (!/^\+?\d{10,15}$/.test(bookingData.contactPhone)) {
      newErrors.contactPhone = 'Введите корректный номер телефона';
    }
    
    if (!bookingData.email || bookingData.email.trim() === '') {
      newErrors.email = 'Введите email для связи';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingData.email)) {
      newErrors.email = 'Введите корректный email';
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
          <label htmlFor="peopleCount">Количество человек</label>
          <input
            type="number"
            id="peopleCount"
            name="peopleCount"
            min="1"
            max="10"
            value={bookingData.peopleCount}
            onChange={handleChange}
            className={errors.peopleCount ? 'error' : ''}
          />
          {errors.peopleCount && <div className="error-message">{errors.peopleCount}</div>}
        </div>
      </div>
      
      <div className="form-section">
        <h3>Контактная информация</h3>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="example@mail.com"
            value={bookingData.email || ''}
            onChange={handleChange}
            className={errors.email ? 'error' : ''}
          />
          {errors.email && <div className="error-message">{errors.email}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="contactPhone">Контактный телефон</label>
          <input
            type="tel"
            id="contactPhone"
            name="contactPhone"
            placeholder="+7 (999) 123-45-67"
            value={bookingData.contactPhone || ''}
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
            value={bookingData.specialRequests || ''}
            onChange={handleChange}
          ></textarea>
        </div>
      </div>
      
      <div className="form-actions">
        <button type="submit" className="form-submit-button" disabled={loading}>
          {loading ? 'Оформляем заказ...' : 'Перейти к подтверждению'}
        </button>
      </div>
    </form>
  );
};

export default OrderForm; 