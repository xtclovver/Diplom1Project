import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { fetchTourById } from '../store/tours/toursSlice';
import { useAppDispatch } from '../store/hooks';
import OrderForm from '../components/order/OrderForm';
import OrderSummary from '../components/order/OrderSummary';
import Spinner from '../components/ui/Spinner';
import './BookingPage.css';

const BookingPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { tour, loading, error } = useSelector((state: any) => state.tours);
  const { isAuthenticated } = useSelector((state: any) => state.auth);
  
  // Получаем данные из параметров навигации
  const bookingData = location.state as {
    tourId: string;
    tourDateId: number;
    startDate: string;
    endDate: string;
  };
  
  const [orderData, setOrderData] = useState({
    tourId: bookingData?.tourId,
    tourDateId: bookingData?.tourDateId,
    roomId: null,
    adults: 2,
    children: 0,
    specialRequests: '',
    contactPhone: '',
    totalPrice: 0
  });
  
  const [step, setStep] = useState(1);
  
  useEffect(() => {
    // Проверяем, авторизован ли пользователь
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/booking' } });
      return;
    }
    
    // Проверяем, есть ли необходимые данные для бронирования
    if (!bookingData || !bookingData.tourId || !bookingData.tourDateId) {
      navigate('/tours');
      return;
    }
    
    // Загружаем информацию о туре
    dispatch(fetchTourById(bookingData.tourId));
  }, [dispatch, navigate, isAuthenticated, bookingData]);
  
  const handleInputChange = (name: string, value: any) => {
    setOrderData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const calculatePrice = () => {
    if (!tour) return 0;
    
    const basePrice = tour.base_price || 0;
    const adultPrice = basePrice * orderData.adults;
    const childPrice = basePrice * 0.7 * orderData.children; // 70% от базовой цены для детей
    
    return adultPrice + childPrice;
  };
  
  useEffect(() => {
    setOrderData(prev => ({
      ...prev,
      totalPrice: calculatePrice()
    }));
  }, [orderData.adults, orderData.children, tour]);
  
  const handleNext = () => {
    setStep(2);
  };
  
  const handleBack = () => {
    setStep(1);
  };
  
  const handleSubmit = () => {
    // Здесь будет отправка заказа на сервер
    console.log('Sending order:', orderData);
    
    // После успешного создания заказа переходим на страницу подтверждения
    navigate('/booking/success', { state: { orderId: 123 } }); // Демо ID заказа
  };
  
  if (loading) {
    return <Spinner />;
  }
  
  if (error) {
    return (
      <div className="booking-error">
        <h2>Ошибка при загрузке данных</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/tours')}>Вернуться к списку туров</button>
      </div>
    );
  }
  
  if (!tour) {
    return (
      <div className="booking-error">
        <h2>Не удалось загрузить информацию о туре</h2>
        <button onClick={() => navigate('/tours')}>Вернуться к списку туров</button>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <h1>Бронирование тура</h1>
      
      <div className="booking-steps">
        <div className={`booking-step ${step >= 1 ? 'active' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-text">Информация</div>
        </div>
        <div className="booking-step-connector"></div>
        <div className={`booking-step ${step >= 2 ? 'active' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-text">Подтверждение</div>
        </div>
      </div>
      
      <div className="booking-container">
        {step === 1 ? (
          <div className="booking-form-container">
            <OrderForm 
              orderData={orderData}
              onChange={handleInputChange}
              onSubmit={handleNext}
            />
          </div>
        ) : (
          <div className="booking-confirm-container">
            <OrderSummary 
              tour={tour}
              orderData={orderData}
              startDate={bookingData.startDate}
              endDate={bookingData.endDate}
            />
            
            <div className="booking-actions">
              <button className="booking-back-button" onClick={handleBack}>
                Назад
              </button>
              <button className="booking-submit-button" onClick={handleSubmit}>
                Подтвердить бронирование
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPage; 