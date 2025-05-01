import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { fetchTourById } from '../store/tours/toursSlice';
import { useAppDispatch } from '../store/hooks';
import OrderForm from '../components/order/OrderForm';
import OrderSummary from '../components/order/OrderSummary';
import Spinner from '../components/ui/Spinner';
import { createOrder, resetCreateOrderSuccess } from '../store/order/orderSlice';
import './BookingPage.css';

interface BookingData {
  tourId: string;
  tourDateId: number;
  roomId?: number | null;
  startDate: string;
  endDate: string;
}

const BookingPage: React.FC = () => {
  console.log('BookingPage - компонент инициализируется');
  
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  
  // --- Извлекаем параметры напрямую --- 
  const tourIdFromParams = searchParams.get('tourId');
  const tourDateIdFromParams = searchParams.get('tourDateId');
  const roomIdFromParams = searchParams.get('roomId');
  const startDateFromParams = searchParams.get('startDate'); // Получаем даты, если они передаются
  const endDateFromParams = searchParams.get('endDate');

  // --- Логируем полученные параметры --- 
  console.log('BookingPage - searchParams:', searchParams.toString());
  console.log('BookingPage - tourId from params:', tourIdFromParams);
  console.log('BookingPage - tourDateId from params:', tourDateIdFromParams);
  console.log('BookingPage - roomId from params:', roomIdFromParams);
  // --- Конец извлечения параметров ---

  console.log('BookingPage - полный URL:', window.location.href);
  console.log('BookingPage - location.pathname:', location.pathname);
  console.log('BookingPage - location.search:', location.search);
  console.log('BookingPage - location.state:', location.state);
  
  console.log('BookingPage - Проверка импортов перед первым useSelector:');
  console.log('- typeof useSelector:', typeof useSelector); // Логируем тип импорта
  console.log('- useSelector:', useSelector); // Логируем сам импорт

  // --- Используем useSelector (без try...catch) --- 
  const tourData = useSelector((state: any) => state.tours);
  const orderState = useSelector((state: any) => state.order);
  const authState = useSelector((state: any) => state.auth);

  // Деструктуризация
  const { tour, loading: tourLoading, error: tourError } = tourData || {}; 
  const { loading: orderLoading, error: orderError, createOrderSuccess } = orderState || {};
  const { isAuthenticated, user } = authState || {};

  console.log('BookingPage - isAuthenticated:', isAuthenticated);
  
  // --- Проверка на наличие необходимых данных из параметров --- 
  const hasRequiredData = !!(tourIdFromParams && tourDateIdFromParams);
  console.log('BookingPage - hasRequiredData:', hasRequiredData);

  const [orderData, setOrderData] = useState({
    // Используем данные из параметров для инициализации state
    tourId: tourIdFromParams || '',
    tourDateId: tourDateIdFromParams ? parseInt(tourDateIdFromParams) : 0,
    roomId: roomIdFromParams ? parseInt(roomIdFromParams) : null,
    peopleCount: 2,
    specialRequests: '',
    contactPhone: '',
    email: user?.email || '',
    totalPrice: 0
  });
  
  const [step, setStep] = useState(1);
  
  useEffect(() => {
    dispatch(resetCreateOrderSuccess());
    
    if (!isAuthenticated) {
      console.log('BookingPage - пользователь не авторизован, перенаправление на /login');
      // Передаем параметры в state для возврата после логина
      const originalParams = new URLSearchParams(location.search).toString();
      navigate('/login', { 
        state: { 
          from: `${location.pathname}?${originalParams}` 
        } 
      });
      return;
    }
    
    if (!hasRequiredData) {
      console.log('BookingPage - нет необходимых данных в URL, перенаправление на /tours');
      navigate('/tours');
      return;
    }

    // Загружаем информацию о туре, используя ID из параметров
    console.log('BookingPage - загрузка информации о туре:', tourIdFromParams);
    // Убедимся, что tourIdFromParams не null перед вызовом dispatch
    if (tourIdFromParams) {
        dispatch(fetchTourById(tourIdFromParams));
    }
  }, [dispatch, navigate, isAuthenticated, hasRequiredData, tourIdFromParams]);
  
  useEffect(() => {
    if (user && user.email) {
      setOrderData(prev => ({
        ...prev,
        email: user.email
      }));
    }
  }, [user, orderData.email]);
  
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
    // Используем данные из state (orderData), который инициализировался из параметров
    const submitData: any = {
      tour_id: parseInt(orderData.tourId), // tourId должен быть числом для бэкенда?
      tour_date_id: orderData.tourDateId,
      people_count: orderData.peopleCount
    };
    
    if (orderData.roomId) {
      submitData.room_id = orderData.roomId;
    }
    
    if (orderData.contactPhone) {
      submitData.contact_phone = orderData.contactPhone;
    }
    
    if (orderData.specialRequests) {
      submitData.special_requests = orderData.specialRequests;
    }
    
    console.log('Отправка заказа на сервер:', submitData);
    // Проверяем, что dispatch вызывается с правильными данными
    if (submitData.tour_id && submitData.tour_date_id) {
        dispatch(createOrder(submitData));
    } else {
        console.error('BookingPage - Ошибка: Недостаточно данных для отправки заказа.', submitData);
    }
  };
  
  if (!hasRequiredData) {
    return (
      <div className="booking-error">
        <h2>Недостаточно данных для бронирования</h2>
        <p>Не удалось получить ID тура или ID даты из URL.</p>
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
    if (!tourLoading) {
        return (
          <div className="booking-error">
            <h2>Не удалось загрузить информацию о туре</h2>
            <p>Пожалуйста, убедитесь, что URL корректен или попробуйте позже.</p>
            <button onClick={() => navigate('/tours')}>Вернуться к списку туров</button>
          </div>
        );
    }
    return null; 
  }

  // Находим объект выбранной даты тура
  let selectedDate: any = undefined; // Инициализируем как undefined

  // Пытаемся получить даты из location.state, если они там есть
  if (location.state?.startDate && location.state?.endDate) {
    console.log('BookingPage - Используем даты из location.state');
    // Формируем объект даты, используя ID из orderData и даты из state
    selectedDate = {
      id: orderData.tourDateId,
      startDate: location.state.startDate,
      endDate: location.state.endDate,
      // Пытаемся добавить priceModifier и availability из загруженного тура, если возможно
      priceModifier: tour?.dates?.find((d: any) => d.id === orderData.tourDateId)?.priceModifier || 1,
      availability: tour?.dates?.find((d: any) => d.id === orderData.tourDateId)?.availability || 0,
    };
  }

  // Если в state дат не было, ищем в загруженном массиве tour.dates
  if (!selectedDate) {
    console.log('BookingPage - Пытаемся найти дату в tour.dates');
    selectedDate = tour?.dates?.find((date: any) => date.id === orderData.tourDateId);
  }

  console.log('BookingPage - Итоговый selectedDate:', selectedDate); // Логируем итоговый результат

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
              tourDate={selectedDate} // Передаем найденный объект даты
              orderData={orderData}
              // startDate и endDate больше не нужны здесь, т.к. есть tourDate
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