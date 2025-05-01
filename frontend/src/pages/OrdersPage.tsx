import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../store/hooks';
import { fetchUserOrders, cancelOrder } from '../store/orders/ordersSlice';
import OrderList from '../components/order/OrderList';
import OrderFilter from '../components/order/OrderFilter';
import Pagination from '../components/ui/Pagination';
import Spinner from '../components/ui/Spinner';
import './OrdersPage.css';

// Определяем интерфейс Order аналогично интерфейсу из OrderList
interface Order {
  id: number;
  tour: {
    id: number;
    name: string;
    image_url: string;
  };
  start_date: string;
  end_date: string;
  status: string;
  total_price: number;
  created_at: string;
  adults: number;
  children: number;
}

// Отладочная функция для логирования состояния
function debugState(state: any) {
  console.log('[OrdersPage] Current state:', state);
  return state;
}

const OrdersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  // Используем обычный useSelector с выводом отладочной информации
  const state = useSelector(debugState);
  const orders = state?.orders?.orders || [];
  const loading = state?.orders?.loading || false;
  const error = state?.orders?.error || null;
  const isAuthenticated = state?.auth?.isAuthenticated || false;
  
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed', 'cancelled'
  
  // Создаём стандартную пагинацию, если её нет в стейте
  const pagination = { page: 1, size: 10, total: orders.length };
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/orders' } });
      return;
    }
    
    dispatch(fetchUserOrders());
  }, [dispatch, navigate, isAuthenticated]);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/orders' } });
      return;
    }
    
    // Добавляем обработку ошибок при загрузке заказов
    try {
      console.log("OrdersPage: Загружаем заказы пользователя");
      dispatch(fetchUserOrders())
        .unwrap()
        .then(data => {
          console.log("OrdersPage: Заказы успешно загружены", data);
        })
        .catch(error => {
          console.error("OrdersPage: Ошибка при загрузке заказов", error);
        });
    } catch (error) {
      console.error("OrdersPage: Критическая ошибка при загрузке заказов", error);
    }
  }, [dispatch, navigate, isAuthenticated]);
  
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
  };
  
  const handleCancelOrder = (orderId: number) => {
    if (window.confirm('Вы уверены, что хотите отменить заказ?')) {
      dispatch(cancelOrder(orderId));
    }
  };
  
  const handlePageChange = (page: number) => {
    // Этот код будет работать, когда реализуем пагинацию на бекенде
    // dispatch(setPage(page));
    console.log('Changing page to', page);
  };
  
  const handlePageSizeChange = (size: number) => {
    // Этот код будет работать, когда реализуем пагинацию на бекенде
    // dispatch(setSize(size));
    console.log('Changing page size to', size);
  };
  
  // Фильтрация заказов с проверкой на существование orders и учетом регистра статусов
  const filteredOrders = orders.filter((order: any) => {
    if (!order || !order.status) return false;
    
    const status = order.status.toUpperCase();
    if (filter === 'all') return true;
    if (filter === 'active') return ['PENDING', 'CONFIRMED', 'PROCESSING', 'PAID'].includes(status);
    if (filter === 'completed') return status === 'COMPLETED';
    if (filter === 'cancelled') return status === 'CANCELLED';
    return true;
  });
  
  if (loading && orders.length === 0) {
    return <Spinner />;
  }
  
  if (error) {
    return (
      <div className="orders-error">
        <h2>Ошибка загрузки заказов</h2>
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div className="orders-page">
      <div className="profile-hero">
        <div className="container">
          <h1>Личный кабинет</h1>
          <p className="profile-subtitle">Ваш профиль и история бронирований</p>
        </div>
      </div>
      
      <div className="profile-container">
        <div className="profile-sidebar">
          <div className="profile-menu">
            <button className="menu-item" onClick={() => navigate('/profile')}>Профиль</button>
            <button className="menu-item active">История заказов</button>
            <button className="menu-item" onClick={() => navigate('/support')}>Техподдержка</button>
          </div>
          
          <OrderFilter activeFilter={filter} onFilterChange={handleFilterChange} />
        </div>
        
        <div className="profile-content">
          <div className="profile-header">
            <h2>История заказов</h2>
          </div>
          
          {filteredOrders.length === 0 ? (
            <div className="no-orders">
              <h3>У вас пока нет заказов</h3>
              <p>После оформления заказа, он появится здесь</p>
              <button 
                className="browse-tours-button" 
                onClick={() => navigate('/tours')}
              >
                Перейти к выбору тура
              </button>
            </div>
          ) : (
            <>
              <OrderList orders={filteredOrders as any} onCancelOrder={handleCancelOrder} />
              
              {pagination.total > pagination.size && (
                <div className="pagination-container">
                  <Pagination 
                    currentPage={pagination.page} 
                    totalPages={Math.ceil(pagination.total / pagination.size)} 
                    onPageChange={handlePageChange} 
                    pageSize={pagination.size}
                    onPageSizeChange={handlePageSizeChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage; 