import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const AdminOrders: React.FC = () => {
  const dispatch = useDispatch();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Загрузка заказов при монтировании компонента
    // Здесь должен быть запрос к API
    setLoading(true);
    
    // Имитация загрузки данных
    setTimeout(() => {
      setOrders([
        { 
          id: 1, 
          user: { id: 1, username: 'user1', fullName: 'Иванов Иван' }, 
          tour: { id: 1, name: 'Тур по Сочи' },
          totalPrice: 25000,
          status: 'confirmed',
          createdAt: '2023-05-15',
          peopleCount: 2
        },
        { 
          id: 2, 
          user: { id: 2, username: 'user2', fullName: 'Петров Петр' }, 
          tour: { id: 2, name: 'Горный курорт' },
          totalPrice: 35000,
          status: 'pending',
          createdAt: '2023-05-18',
          peopleCount: 3
        },
      ]);
      setLoading(false);
    }, 800);
  }, []);
  
  const handleStatusChange = (orderId: number, newStatus: string) => {
    // dispatch(updateOrderStatus({ orderId, status: newStatus }));
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };
  
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'В обработке';
      case 'confirmed':
        return 'Подтвержден';
      case 'paid':
        return 'Оплачен';
      case 'cancelled':
        return 'Отменен';
      case 'completed':
        return 'Завершен';
      default:
        return status;
    }
  };
  
  return (
    <div className="admin-orders">
      <div className="admin-header">
        <h2>Управление заказами</h2>
      </div>
      
      {loading ? (
        <div className="admin-loading">Загрузка...</div>
      ) : error ? (
        <div className="admin-error">{error}</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Пользователь</th>
                <th>Тур</th>
                <th>Цена</th>
                <th>Статус</th>
                <th>Дата создания</th>
                <th>Кол-во человек</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.user?.fullName}</td>
                  <td>{order.tour?.name}</td>
                  <td>{order.totalPrice} ₽</td>
                  <td>
                    <span className={`status-badge status-${order.status}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>{order.peopleCount}</td>
                  <td className="admin-actions">
                    <select 
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="admin-select"
                    >
                      <option value="pending">В обработке</option>
                      <option value="confirmed">Подтвержден</option>
                      <option value="paid">Оплачен</option>
                      <option value="cancelled">Отменен</option>
                      <option value="completed">Завершен</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminOrders; 