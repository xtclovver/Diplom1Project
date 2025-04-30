import React, { useState } from 'react';
import './OrderForm.css';

interface OrderFormProps {
  orderData: {
    tourId: string;
    tourDateId: number;
    roomId: number | null;
    adults?: number;
    children?: number;
    peopleCount?: number;
    totalPrice: number;
    contactPhone?: string;
    specialRequests?: string;
    email?: string;
  };
  onChange: (name: string, value: any) => void;
  onSubmit: () => void;
  loading?: boolean;
}

const OrderForm: React.FC<OrderFormProps> = ({ orderData, onChange, onSubmit, loading }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  
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
  
  const handlePaymentMethodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentMethod(e.target.value);
  };
  
  const handleTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTermsAccepted(e.target.checked);
    
    if (e.target.checked && errors.terms) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.terms;
        return newErrors;
      });
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!orderData.peopleCount || orderData.peopleCount < 1) {
      newErrors.peopleCount = 'Необходимо указать минимум 1 человека';
    }
    
    if (!orderData.contactPhone || orderData.contactPhone.trim() === '') {
      newErrors.contactPhone = 'Введите номер телефона для связи';
    } else if (!/^\+?\d{10,15}$/.test(orderData.contactPhone)) {
      newErrors.contactPhone = 'Введите корректный номер телефона';
    }
    
    if (!orderData.email || orderData.email.trim() === '') {
      newErrors.email = 'Введите email для связи';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderData.email)) {
      newErrors.email = 'Введите корректный email';
    }
    
    if (!termsAccepted) {
      newErrors.terms = 'Необходимо принять условия бронирования';
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
            value={orderData.peopleCount}
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
            value={orderData.email || ''}
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
            value={orderData.contactPhone || ''}
            onChange={handleChange}
            className={errors.contactPhone ? 'error' : ''}
          />
          {errors.contactPhone && <div className="error-message">{errors.contactPhone}</div>}
        </div>
      </div>
      
      <div className="form-section">
        <h3>Способ оплаты</h3>
        
        <div className="payment-methods">
          <div className="payment-method">
            <input
              type="radio"
              id="paymentCard"
              name="paymentMethod"
              value="card"
              checked={paymentMethod === 'card'}
              onChange={handlePaymentMethodChange}
            />
            <label htmlFor="paymentCard">
              <span className="payment-icon card-icon"></span>
              <span className="payment-label">Банковская карта</span>
            </label>
          </div>
          
          <div className="payment-method">
            <input
              type="radio"
              id="paymentOnline"
              name="paymentMethod"
              value="online"
              checked={paymentMethod === 'online'}
              onChange={handlePaymentMethodChange}
            />
            <label htmlFor="paymentOnline">
              <span className="payment-icon online-icon"></span>
              <span className="payment-label">Онлайн-банкинг</span>
            </label>
          </div>
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
            value={orderData.specialRequests || ''}
            onChange={handleChange}
          ></textarea>
        </div>
      </div>
      
      <div className="form-section terms-section">
        <div className="form-group checkbox-group">
          <input
            type="checkbox"
            id="termsAccepted"
            checked={termsAccepted}
            onChange={handleTermsChange}
            className={errors.terms ? 'error' : ''}
          />
          <label htmlFor="termsAccepted" className="checkbox-label">
            Я ознакомлен и согласен с <a href="#" target="_blank">условиями бронирования</a> и <a href="#" target="_blank">правилами отмены</a>
          </label>
          {errors.terms && <div className="error-message">{errors.terms}</div>}
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