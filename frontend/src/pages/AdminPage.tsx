import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { checkAdminAccess } from '../store/auth/authSlice';
import AdminTours from '../components/admin/AdminTours';
import AdminHotels from '../components/admin/AdminHotels';
import AdminOrders from '../components/admin/AdminOrders';
import AdminUsers from '../components/admin/AdminUsers';
import AdminSupport from '../components/admin/AdminSupport';
import AdminDashboard from '../components/admin/AdminDashboard';
import './AdminPage.css';

const AdminPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { isAdmin, isAuthenticated, loading } = useSelector((state: any) => state.auth);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    dispatch(checkAdminAccess() as any);
  }, [dispatch, isAuthenticated, navigate]);
  
  useEffect(() => {
    if (!loading && !isAdmin && isAuthenticated) {
      navigate('/');
    }
  }, [isAdmin, loading, isAuthenticated, navigate]);
  
  if (loading) {
    return <div className="admin-loading">Загрузка...</div>;
  }
  
  if (!isAdmin) return null;
  
  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-sidebar">
          <h1 className="admin-title">Панель администратора</h1>
          
          <nav className="admin-nav">
            <Link to="/admin" className="admin-nav-item">
              Дашборд
            </Link>
            <Link to="/admin/tours" className="admin-nav-item">
              Управление турами
            </Link>
            <Link to="/admin/hotels" className="admin-nav-item">
              Управление отелями
            </Link>
            <Link to="/admin/orders" className="admin-nav-item">
              Управление заказами
            </Link>
            <Link to="/admin/users" className="admin-nav-item">
              Управление пользователями
            </Link>
            <Link to="/admin/support" className="admin-nav-item">
              Техническая поддержка
            </Link>
          </nav>
        </div>
        
        <div className="admin-content">
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="tours/*" element={<AdminTours />} />
            <Route path="hotels/*" element={<AdminHotels />} />
            <Route path="orders/*" element={<AdminOrders />} />
            <Route path="users/*" element={<AdminUsers />} />
            <Route path="support/*" element={<AdminSupport />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminPage; 