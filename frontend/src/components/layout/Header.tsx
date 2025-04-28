import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../store/hooks';
import { logout, getUserProfile } from '../../store/auth/authSlice';
import './Header.css';

const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const authState = useSelector((state: any) => state.auth);
  const { user, isAuthenticated } = authState;

  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(getUserProfile());
    }
  }, [isAuthenticated, user, dispatch]);

  // Функция для выхода из системы
  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  // Получаем имя пользователя
  const getFullName = () => {
    if (!user) return '';
    
    // Если есть fullName, используем его
    if (user.fullName) {
      return user.fullName;
    }
    
    // Если ничего нет, используем имя пользователя
    return user.username || '';
  };

  // Изображение аватара по умолчанию
  const defaultAvatar = '/images/default-avatar.png';

  return (
    <header className="header">
      <div className="container">
        <div className="logo">
          <Link to="/">ТурАгенство</Link>
        </div>
        <nav className="main-nav">
          <ul>
            <li><Link to="/">Главная</Link></li>
            <li><Link to="/tours">Туры</Link></li>
            {isAuthenticated ? (
              <>
                <li><Link to="/orders">Мои заказы</Link></li>
                <li><Link to="/support">Тех. поддержка</Link></li>
                {user && user.role && user.role.name === 'admin' && (
                  <li><Link to="/admin">Админ панель</Link></li>
                )}
                <li className="user-profile">
                  <Link to="/profile" className="profile-link">
                    <div className="user-avatar">
                      <img src={user?.avatar || defaultAvatar} alt="Аватар" />
                    </div>
                    <span className="user-name">{getFullName()}</span>
                  </Link>
                  <button onClick={handleLogout} className="logout-button">Выйти</button>
                </li>
              </>
            ) : (
              <>
                <li><Link to="/login">Войти</Link></li>
                <li><Link to="/register">Регистрация</Link></li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header; 