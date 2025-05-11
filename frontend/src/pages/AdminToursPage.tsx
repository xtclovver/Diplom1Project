import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AdminTours from '../components/admin/AdminTours';
import './ProfilePage.css';
import './AdminToursPage.css';

const AdminToursPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useSelector((state: any) => state.auth);
  
  // Проверка, является ли пользователь администратором
  const isUserAdmin = (): boolean => {
    if (!user) return false;
    
    // Проверяем разные варианты структуры объекта пользователя
    if (user.role && user.role.name === 'admin') return true;
    if (user.role && user.role.name === 'админ') return true;
    if (user.roleId === 1) return true;
    if (user.username === 'admin') return true;
    if (user.role === 'admin') return true;
    
    console.log('[AdminToursPage] Проверка администратора:', user);
    
    return false;
  };
  
  // Проверяем, что пользователь авторизован и имеет права администратора
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate('/login', { state: { from: '/admin/tours' } });
        return;
      }
      
      if (!isUserAdmin()) {
        navigate('/profile');
        return;
      }
    }
  }, [isAuthenticated, user, loading, navigate]);
  
  // Отображаем спиннер, пока загружаются данные
  if (loading) {
    return <div className="loading-spinner">Загрузка...</div>;
  }
  
  return (
    <div className="profile-page admin-tours-page">
      <div className="profile-hero">
        <div className="container">
          <h1>Управление турами</h1>
          <p className="profile-subtitle">Создавайте, редактируйте и удаляйте туры в системе</p>
        </div>
      </div>
      
      <div className="profile-container">
        <div className="profile-sidebar">
          <div className="profile-menu">
            <button className="menu-item" onClick={() => navigate('/profile')}>Профиль</button>
            <button className="menu-item" onClick={() => navigate('/orders')}>История заказов</button>
            <button className="menu-item" onClick={() => navigate('/support')}>Техподдержка</button>
            
            {/* Раздел администрирования */}
            <div className="menu-group">
              <div className="menu-group-title">Администрирование</div>
              <div className="menu-group-items">
                <button 
                  className="menu-item submenu-item active" 
                  onClick={() => navigate('/admin/tours')}
                >
                  Управление турами
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="profile-content admin-tours-container">
          <AdminTours />
        </div>
      </div>
    </div>
  );
};

export default AdminToursPage; 