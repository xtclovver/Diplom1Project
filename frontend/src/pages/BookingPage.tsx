import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { fetchTourById } from '../store/tours/toursSlice';
import { useAppDispatch } from '../store/hooks';
import OrderForm from '../components/order/OrderForm';
import OrderSummary from '../components/order/OrderSummary';
import Spinner from '../components/ui/Spinner';
import { createOrder, resetCreateOrderSuccess } from '../store/order/orderSlice';
import './BookingPage.css';

const BookingPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { tour, loading: tourLoading, error: tourError } = useSelector((state: any) => state.tours);
  const { loading: orderLoading, error: orderError, createOrderSuccess } = useSelector((state: any) => state.order);
  const { isAuthenticated, user } = useSelector((state: any) => state.auth);
  
  // Значение по умолчанию для данных бронирования
  const defaultBookingData = {
    tourId: '',
    tourDateId: 0,
    startDate: '',
    endDate: ''
  };
  
  // Получаем данные из параметров навигации
  const bookingData = location.state ? 
    (location.state as {
      tourId: string;
      tourDateId: number;
      startDate: string;
      endDate: string;
    }) : defaultBookingData;
  
  const [orderData, setOrderData] = useState({
    tourId: bookingData.tourId,
    tourDateId: bookingData.tourDateId,
    roomId: null,
    peopleCount: 2,
    specialRequests: '',
    contactPhone: '',
    email: user?.email || '',
    totalPrice: 0
  });
  
  const [step, setStep] = useState(1);
  
  // Проверка на наличие необходимых данных
  const hasRequiredData = location.state && location.state.tourId && location.state.tourDateId;
  
  useEffect(() => {
    // Очищаем флаг успешного создания заказа при монтировании компонента
    dispatch(resetCreateOrderSuccess());
    
    // Проверяем, авторизован ли пользователь
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname, bookingData } });
      return;
    }
    
    // При отсутствии данных для бронирования оставляем пользователя на странице
    // и показываем ему сообщение об ошибке через рендеринг
    
    // Загружаем информацию о туре, только если у нас есть необходимые данные
    if (hasRequiredData) {
      dispatch(fetchTourById(bookingData.tourId));
    }
  }, [dispatch, navigate, isAuthenticated, bookingData, location.pathname, hasRequiredData]);
  
  // Если пользователь уже авторизован, обновляем email в данных заказа
  useEffect(() => {
    if (user && user.email) {
      setOrderData(prev => ({
        ...prev,
        email: user.email
      }));
    }
  }, [user]);
  
  // Отслеживаем успешное создание заказа и перенаправляем на страницу успеха
  useEffect(() => {
    if (createOrderSuccess) {
      navigate('/booking/success');
    }
  }, [createOrderSuccess, navigate]);
  
  const handleInputChange = (name: string, value: any) => {
    setOrderData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const calculatePrice = () => {
    if (!tour) return 0;
    
    // Находим выбранную дату тура, чтобы получить модификатор цены
    const selectedDate = tour.dates?.find((date: any) => date.id === orderData.tourDateId);
    const priceModifier = selectedDate?.priceModifier || 1;
    
    const basePrice = tour.base_price || 0;
    return basePrice * priceModifier * orderData.peopleCount;
  };
  
  useEffect(() => {
    setOrderData(prev => ({
      ...prev,
      totalPrice: calculatePrice()
    }));
  }, [orderData.peopleCount, tour]);
  
  const handleNext = () => {
    setStep(2);
  };
  
  const handleBack = () => {
    setStep(1);
  };
  
  const handleSubmit = () => {
    // Отправляем заказ на сервер
    const submitData: any = {
      tour_id: parseInt(orderData.tourId),
      tour_date_id: orderData.tourDateId,
      people_count: orderData.peopleCount
    };
    
    // Добавляем необязательные поля, если они заполнены
    if (orderData.roomId) {
      submitData.room_id = orderData.roomId;
    }
    
    // Добавляем дополнительные информационные поля, если они заполнены
    if (orderData.contactPhone) {
      submitData.contact_phone = orderData.contactPhone;
    }
    
    if (orderData.specialRequests) {
      submitData.special_requests = orderData.specialRequests;
    }
    
    console.log('Отправка заказа на сервер:', submitData);
    dispatch(createOrder(submitData));
  };
  
  // Если отсутствуют необходимые данные, показываем сообщение об ошибке
  if (!hasRequiredData) {
    return (
      <div className="booking-error">
        <h2>Недостаточно данных для бронирования</h2>
        <p>Пожалуйста, выберите тур и дату поездки перед бронированием.</p>
        <Link to="/tours" className="error-back-btn">Перейти к выбору тура</Link>
      </div>
    );
  }
  
  if (tourLoading) {
    return <Spinner />;
  }
  
  if (tourError) {
    return (
      <div className="booking-error">
        <h2>Ошибка при загрузке данных</h2>
        <p>{tourError}</p>
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
              loading={orderLoading}
            />
            {orderError && (
              <div className="error-message booking-error-message">
                {orderError}
              </div>
            )}
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
              <button 
                className="booking-submit-button" 
                onClick={handleSubmit}
                disabled={orderLoading}
              >
                {orderLoading ? 'Оформление...' : 'Подтвердить бронирование'}
              </button>
            </div>
            
            {orderError && (
              <div className="error-message booking-error-message">
                {orderError}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPage; 