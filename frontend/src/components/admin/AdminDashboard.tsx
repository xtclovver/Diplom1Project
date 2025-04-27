import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const AdminDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalTours: 0,
    totalHotels: 0,
    totalRevenue: 0,
    openTickets: 0,
    recentOrders: [] as any[],
    popularTours: [] as any[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Загрузка статистики при монтировании компонента
    // В реальном приложении здесь будет запрос к API
    setLoading(true);
    
    // Имитация загрузки данных
    setTimeout(() => {
      setStats({
        totalUsers: 356,
        totalOrders: 123,
        totalTours: 42,
        totalHotels: 15,
        totalRevenue: 1250000,
        openTickets: 8,
        recentOrders: [
          { 
            id: 1, 
            user: { fullName: 'Иванов Иван' }, 
            tour: { name: 'Тур по Сочи' },
            totalPrice: 25000,
            status: 'confirmed',
            createdAt: '2023-05-15'
          },
          { 
            id: 2, 
            user: { fullName: 'Петров Петр' }, 
            tour: { name: 'Горный курорт' },
            totalPrice: 35000,
            status: 'pending',
            createdAt: '2023-05-18'
          },
          { 
            id: 3, 
            user: { fullName: 'Сидоров Павел' }, 
            tour: { name: 'Экскурсия по Москве' },
            totalPrice: 15000,
            status: 'paid',
            createdAt: '2023-05-20'
          },
        ],
        popularTours: [
          { id: 1, name: 'Тур в Сочи', orders: 45, revenue: 1125000 },
          { id: 2, name: 'Горный курорт "Красная поляна"', orders: 32, revenue: 960000 },
          { id: 3, name: 'Экскурсия по Москве', orders: 28, revenue: 420000 },
          { id: 4, name: 'Золотое кольцо России', orders: 24, revenue: 840000 },
          { id: 5, name: 'Санкт-Петербург - Северная столица', orders: 20, revenue: 600000 },
        ]
      });
      setLoading(false);
    }, 800);
  }, []);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };
  
  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>Панель управления</h2>
      </div>
      
      {loading ? (
        <div className="admin-loading">Загрузка...</div>
      ) : error ? (
        <div className="admin-error">{error}</div>
      ) : (
        <>
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalUsers}</div>
                <div className="stat-label">Пользователей</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🧾</div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalOrders}</div>
                <div className="stat-label">Заказов</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🏨</div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalHotels}</div>
                <div className="stat-label">Отелей</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">✈️</div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalTours}</div>
                <div className="stat-label">Туров</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
                <div className="stat-label">Общий доход</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🎫</div>
              <div className="stat-info">
                <div className="stat-value">{stats.openTickets}</div>
                <div className="stat-label">Открытых тикетов</div>
              </div>
            </div>
          </div>
          
          <div className="dashboard-grid">
            <div className="dashboard-panel recent-orders">
              <h3>Последние заказы</h3>
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Клиент</th>
                    <th>Тур</th>
                    <th>Статус</th>
                    <th>Сумма</th>
                    <th>Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map(order => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.user.fullName}</td>
                      <td>{order.tour.name}</td>
                      <td>
                        <span className={`status-badge status-${order.status}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>{formatCurrency(order.totalPrice)}</td>
                      <td>{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="dashboard-panel popular-tours">
              <h3>Популярные туры</h3>
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Тур</th>
                    <th>Заказов</th>
                    <th>Доход</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.popularTours.map(tour => (
                    <tr key={tour.id}>
                      <td>{tour.name}</td>
                      <td>{tour.orders}</td>
                      <td>{formatCurrency(tour.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard; 