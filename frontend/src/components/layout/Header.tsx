import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../store/hooks';
import { logout, getUserProfile } from '../../store/auth/authSlice';
import './Header.css';

const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const authState = useSelector((state: any) => state.auth);
  const { user, isAuthenticated } = authState;
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);

  // Получаем профиль пользователя если авторизован
  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(getUserProfile());
    }
  }, [isAuthenticated, user, dispatch]);

  // Обработчик скролла для изменения стиля хедера при прокрутке
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Закрытие мобильного меню при изменении маршрута
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Функция для выхода из системы
  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  // Определяем, активна ли ссылка
  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };

  // Получаем имя пользователя
  const getFullName = (): string => {
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
    <header className={`header ${scrolled ? 'scrolled' : ''}`}>
      <div className="container header-container">
        <div className="header-logo">
          <Link to="/">
            <div className="header-logo-text">
              ПланетаТур
              <span>Путешествуй с нами</span>
            </div>
          </Link>
        </div>
        
        <nav className="header-nav">
          <ul className="header-menu">
            <li className="header-menu-item">
              <Link to="/" className={isActive('/') ? 'active' : ''}>
                Главная
              </Link>
            </li>
            
            <li className="header-menu-item dropdown">
              <Link to="/tours" className={location.pathname.includes('/tours') ? 'active' : ''}>
                Туры
              </Link>
              <ul className="dropdown-menu">
                <li><Link to="/tours/hot">Горящие туры</Link></li>
                <li><Link to="/tours/europe">Европа</Link></li>
                <li><Link to="/tours/asia">Азия</Link></li>
                <li><Link to="/tours/russia">Россия</Link></li>
              </ul>
            </li>
            
            <li className="header-menu-item">
              <Link to="/about" className={isActive('/about') ? 'active' : ''}>
                О нас
              </Link>
            </li>
            
            <li className="header-menu-item">
              <Link to="/contacts" className={isActive('/contacts') ? 'active' : ''}>
                Контакты
              </Link>
            </li>
          </ul>
        </nav>
        
        <div className="header-auth">
          {isAuthenticated ? (
            <div className="header-user-menu">
              <span className="header-username">Привет, {getFullName()}!</span>
              <div className="header-dropdown">
                <button className="header-dropdown-btn">Мой профиль</button>
                <div className="header-dropdown-content">
                  <Link to="/profile">Личный кабинет</Link>
                  <Link to="/orders">Мои заказы</Link>
                  <Link to="/support">Поддержка</Link>
                  {user?.role?.name === 'admin' && <Link to="/admin">Админ панель</Link>}
                  {user?.role?.name === 'support' && <Link to="/support/tickets">Тикеты поддержки</Link>}
                  <button onClick={handleLogout}>Выйти</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="header-auth-buttons">
              <Link to="/login" className="header-login-btn">Войти</Link>
              <Link to="/register" className="header-register-btn">Регистрация</Link>
            </div>
          )}
        </div>
        
        <div 
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      
      <div className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}>
        <div className="container">
          <ul>
            <li><Link to="/">Главная</Link></li>
            <li><Link to="/tours">Туры</Link></li>
            <li><Link to="/about">О нас</Link></li>
            <li><Link to="/contacts">Контакты</Link></li>
            {isAuthenticated ? (
              <>
                <li><Link to="/profile">Личный кабинет</Link></li>
                <li><Link to="/orders">Мои заказы</Link></li>
                <li><Link to="/support">Поддержка</Link></li>
                {user?.role?.name === 'admin' && <li><Link to="/admin">Админ панель</Link></li>}
                {user?.role?.name === 'support' && <li><Link to="/support/tickets">Тикеты поддержки</Link></li>}
                <li><button onClick={handleLogout}>Выйти</button></li>
              </>
            ) : (
              <>
                <li><Link to="/login">Войти</Link></li>
                <li><Link to="/register">Регистрация</Link></li>
              </>
            )}
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Header; 