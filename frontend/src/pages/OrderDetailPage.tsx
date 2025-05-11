import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../store/hooks';
import { orderService } from '../services/api';
import OrderSummary from '../components/order/OrderSummary';
import OrderStatus from '../components/order/OrderStatus';
import Spinner from '../components/ui/Spinner';
import './OrderDetailPage.css';

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Проверяем авторизацию
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/orders/${id}` } });
      return;
    }
    
    const fetchOrderDetails = async () => {
      setLoading(true);
      try {
        // Получаем данные заказа
        const response = await orderService.getOrderById(id as string);
        const orderData = response.data;
        console.log('Данные заказа:', orderData);
        
        // Если есть номер, но нет полной информации о нем, делаем дополнительный запрос
        if (orderData.roomId || orderData.room_id) {
          try {
            const roomId = orderData.roomId || orderData.room_id;
            
            // Проверяем, есть ли полные данные о номере
            if (
              !orderData.room?.price || 
              (orderData.room && 
                (typeof orderData.room.price === 'undefined' || 
                 orderData.room.price === null)
              )
            ) {
              console.log('Отсутствует стоимость номера, делаем дополнительный запрос');
              
              // Делаем запрос на получение детальной информации о номере
              const roomResponse = await (orderService as any).getRoomById(roomId);
              
              if (roomResponse && roomResponse.data) {
                console.log('Получены дополнительные данные о номере:', roomResponse.data);
                
                // Объединяем данные
                orderData.room = {
                  ...(orderData.room || {}),
                  ...roomResponse.data
                };
              }
            }
          } catch (roomError) {
            console.error('Ошибка при получении дополнительных данных о номере:', roomError);
            // Продолжаем с теми данными, которые есть
          }
        }
        
        // Сохраняем обогащенные данные
        setOrder(orderData);
        console.log('Итоговые данные для отображения:', orderData);
      } catch (err: any) {
        console.error('Ошибка при загрузке заказа:', err);
        setError(err.response?.data?.message || 'Ошибка при загрузке данных заказа');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [id, navigate, isAuthenticated]);
  
  const handleBack = () => {
    navigate('/orders');
  };
  
  if (loading) {
    return <Spinner />;
  }
  
  if (error) {
    return (
      <div className="order-detail-error">
        <h2>Ошибка</h2>
        <p>{error}</p>
        <button onClick={handleBack}>Вернуться к списку заказов</button>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="order-detail-error">
        <h2>Заказ не найден</h2>
        <p>Заказ с указанным ID не существует или был удален.</p>
        <button onClick={handleBack}>Вернуться к списку заказов</button>
      </div>
    );
  }
  
  // Подготавливаем данные для OrderSummary
  const orderData = {
    tourId: order.tour.id.toString(),
    tourDateId: order.tourDateId || order.tour_date_id,
    roomId: order.roomId || order.room_id,
    peopleCount: (order.adults || 0) + (order.children || 0),
    totalPrice: order.total_price,
    contactPhone: order.contact_phone,
    specialRequests: order.special_requests,
    email: order.user?.email
  };
  
  // Подготавливаем данные о туре
  const tourData = {
    id: order.tour.id,
    name: order.tour.name,
    description: order.tour.description || '',
    base_price: order.tour.base_price || order.tour.basePrice || 0,
    imageUrl: order.tour.image_url || order.tour.imageUrl,
    duration: order.tour.duration || 0,
    city: order.tour.city
  };
  
  // Подготавливаем данные о датах
  const tourDateData = {
    id: order.tourDateId || order.tour_date_id,
    tourId: order.tour.id,
    startDate: order.start_date,
    endDate: order.end_date,
    priceModifier: 1,
    availability: 0
  };
  
  // Обеспечиваем принудительную установку стоимости номера, если её нет, но есть общая стоимость
  let roomData = null;
  let missingRoomPrice = false;
  
  if (order.room) {
    const roomPrice = order.room.price || 0;
    missingRoomPrice = roomPrice === 0 || roomPrice === null || typeof roomPrice === 'undefined';
    
    roomData = {
      id: order.room.id,
      hotelId: order.room.hotelId || order.room.hotel_id,
      description: order.room.description,
      beds: order.room.beds,
      // Если цена комнаты отсутствует, но мы знаем, что она должна быть,
      // используем приближенное значение на основе total_price и базовой стоимости тура
      price: !missingRoomPrice ? roomPrice : (
        // Приблизительный расчет: (total_price - базовая_цена_тура * кол-во_человек) / кол-во_ночей
        Math.round(
          (order.total_price - 
            (order.tour.base_price || order.tour.basePrice || 0) * 
            ((order.adults || 0) + (order.children || 0))
          ) / (order.duration ? order.duration - 1 : 1)
        )
      ),
      imageUrl: order.room.imageUrl || order.room.image_url
    };
    
    if (missingRoomPrice) {
      console.log('Внимание: Цена номера отсутствует, используется приблизительный расчет:', roomData.price);
    }
  }
  
  console.log('Подготовленные данные для OrderSummary:', {
    tourData,
    tourDateData,
    roomData,
    orderData,
    missingRoomPrice
  });
  
  return (
    <div className="order-detail-page">
      <div className="order-detail-container">
        <div className="order-detail-header">
          <button className="back-button" onClick={handleBack}>
            &larr; Назад к заказам
          </button>
          <h1>Детали заказа #{order.id}</h1>
          <div className="order-status">
            <OrderStatus status={order.status} />
          </div>
        </div>
        
        <div className="order-summary-container">
          <OrderSummary
            tour={tourData}
            tourDate={tourDateData}
            selectedRoom={roomData}
            orderData={orderData}
          />
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage; 