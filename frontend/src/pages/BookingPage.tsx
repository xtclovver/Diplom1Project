import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { fetchTourById } from '../store/tours/toursSlice';
import { useAppDispatch } from '../store/hooks';
import OrderForm from '../components/order/OrderForm';
import OrderSummary from '../components/order/OrderSummary';
import Spinner from '../components/ui/Spinner';
import { createOrder, resetCreateOrderSuccess } from '../store/order/orderSlice';
import { hotelService } from '../services/api';
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
  
  // Добавляем состояние для выбранного номера
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  
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
      console.log('BookingPage - createOrderSuccess = true, перенаправление на /orders');
      // Устанавливаем таймаут для гарантированного перенаправления
      const redirectTimer = setTimeout(() => {
        navigate('/orders');
      }, 100);
      return () => clearTimeout(redirectTimer);
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
    
    // Используем basePrice или base_price, в зависимости от того, что доступно
    const basePrice = tour.basePrice || tour.base_price || 0;
    console.log('BookingPage - Базовая цена тура:', basePrice);
    
    // Базовая стоимость тура
    const tourPrice = basePrice * priceModifier * (orderData.peopleCount || 1);
    
    // Стоимость номера в отеле (если выбран)
    let roomPrice = 0;
    if (orderData.roomId && selectedRoom) {
      const days = selectedDate ? calculateDaysFromDates(selectedDate.startDate, selectedDate.endDate) : tour.duration || 1;
      const nights = Math.max(1, days - 1); // Минимум 1 ночь
      roomPrice = selectedRoom.price * nights * (orderData.peopleCount || 1);
      console.log('BookingPage - Данные для расчета стоимости номера:', {
        roomId: orderData.roomId,
        roomPrice: selectedRoom.price,
        nights,
        peopleCount: orderData.peopleCount,
        totalRoomPrice: roomPrice
      });
    }
    
    // Общая стоимость = стоимость тура + стоимость номера
    const calculatedPrice = tourPrice + roomPrice;
    console.log('BookingPage - Расчет полной стоимости:', {
      tourPrice,
      roomPrice,
      calculatedPrice
    });
    
    // Проверяем результат на NaN
    return isNaN(calculatedPrice) ? 0 : calculatedPrice;
  };
  
  // Вспомогательная функция для расчета количества дней
  const calculateDaysFromDates = (startDateStr: string, endDateStr: string): number => {
    try {
      const start = new Date(startDateStr);
      const end = new Date(endDateStr);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return tour.duration || 1;
      }
      
      const diffTime = Math.abs(end.getTime() - start.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 чтобы учесть день отъезда
    } catch (error) {
      console.error("Ошибка при расчете длительности:", error);
      return tour.duration || 1;
    }
  };
  
  useEffect(() => {
    const price = calculatePrice();
    setOrderData(prev => ({
      ...prev,
      totalPrice: price
    }));
    console.log('BookingPage - Рассчитанная стоимость с учетом номера:', price);
  }, [selectedRoom, orderData.peopleCount, tour, orderData.tourDateId]);
  
  const handleNext = () => {
    setStep(2);
  };
  
  const handleBack = () => {
    setStep(1);
  };
  
  const handleSubmit = () => {
    // Пересчитываем итоговую стоимость для отправки на сервер
    const totalPrice = calculatePrice();
    
    // Используем данные из state (orderData), который инициализировался из параметров
    const submitData: any = {
      tour_id: parseInt(orderData.tourId),
      tour_date_id: orderData.tourDateId,
      people_count: orderData.peopleCount,
      total_price: totalPrice // Добавляем рассчитанную стоимость
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
    
    console.log('Отправка заказа на сервер с указанием полной стоимости:', submitData);
    // Проверяем, что dispatch вызывается с правильными данными
    if (submitData.tour_id && submitData.tour_date_id) {
      // Очищаем возможные предыдущие флаги успеха
      dispatch(resetCreateOrderSuccess());
      
      // Отправляем запрос на создание заказа
      dispatch(createOrder(submitData))
        .then((result) => {
          // После успешного создания заказа
          if (result.meta.requestStatus === 'fulfilled') {
            console.log('BookingPage - Заказ успешно создан, результат:', result.payload);
            // Принудительное перенаправление на страницу заказов
            navigate('/orders');
          }
        })
        .catch((error) => {
          console.error('BookingPage - Ошибка при создании заказа:', error);
        });
    } else {
      console.error('BookingPage - Ошибка: Недостаточно данных для отправки заказа.', submitData);
    }
  };
  
  // Убираем дублирование кода
  useEffect(() => {
    // Если есть roomId, пытаемся найти информацию о номере в отеле
    if (orderData.roomId && tour?.hotels) {
      // Ищем номер в списке отелей тура
      for (const hotel of tour.hotels) {
        if (hotel.rooms) {
          const room = hotel.rooms.find((r: any) => r.id === orderData.roomId);
          if (room) {
            console.log('BookingPage - Найден номер:', room);
            setSelectedRoom(room);
            return;
          }
        }
      }
      
      // Если номер не найден в отелях тура, загружаем данные о номере
      const fetchRoomData = async () => {
        try {
          console.log('BookingPage - Загрузка информации о номере с ID:', orderData.roomId);
          
          // Используем любой доступный метод для получения данных о номере
          // Сначала пробуем получить номера отеля, а затем найти нужный номер
          // Чтобы обойти отсутствие метода getRoomById в TypeScript версии
          
          // Если есть информация о номере, мы знаем к какому отелю он относится
          if (tour.hotels && tour.hotels.length > 0) {
            for (const hotel of tour.hotels) {
              try {
                const roomsResponse = await hotelService.getHotelRooms(hotel.id);
                const rooms = roomsResponse.data;
                const room = rooms.find((r: any) => r.id === orderData.roomId);
                if (room) {
                  console.log('BookingPage - Номер найден в отеле:', hotel.name);
                  setSelectedRoom(room);
                  return;
                }
              } catch (error) {
                console.error(`Ошибка при загрузке номеров отеля ${hotel.id}:`, error);
              }
            }
          }
          
          // Прямой запрос через API, используя any для обхода ограничений типа
          // Этот код будет работать, если метод существует в JavaScript реализации
          try {
            const response = await (hotelService as any).getRoomById(orderData.roomId);
            console.log('BookingPage - Получены данные о номере:', response.data);
            setSelectedRoom(response.data);
          } catch (roomError) {
            console.error('Не удалось получить данные о номере через getRoomById:', roomError);
          }
        } catch (error) {
          console.error('Ошибка при загрузке данных о номере:', error);
        }
      };
      
      fetchRoomData();
    }
  }, [orderData.roomId, tour]);
  
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
  
  // Подготавливаем данные тура для передачи в компонент OrderSummary
  // Преобразуем данные, учитывая возможное различие в именах полей (camelCase vs snake_case)
  const preparedTour = {
    ...tour,
    base_price: tour?.basePrice || tour?.base_price || 0, // Обеспечиваем совместимость с обоими вариантами имени поля
  };
  
  console.log('BookingPage - Подготовленные данные тура:', preparedTour);

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
              tour={preparedTour}
              tourDate={selectedDate} // Передаем найденный объект даты
              selectedRoom={selectedRoom} // Передаем информацию о выбранном номере
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