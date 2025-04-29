import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  // Функция для логина/выхода пользователя (для демонстрации)
  const toggleAuth = () => {
    setIsAuthenticated(!isAuthenticated);
  };
  
  // Определяем, активна ли ссылка
  const isActive = (path) => {
    return location.pathname === path;
  };

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
              <span className="header-username">Привет, Пользователь!</span>
              <div className="header-dropdown">
                <button className="header-dropdown-btn">Мой профиль</button>
                <div className="header-dropdown-content">
                  <Link to="/profile">Личный кабинет</Link>
                  <Link to="/orders">Мои заказы</Link>
                  <button onClick={toggleAuth}>Выйти</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="header-auth-buttons">
              <button onClick={toggleAuth} className="header-login-btn">Войти</button>
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
                <li><button onClick={toggleAuth}>Выйти</button></li>
              </>
            ) : (
              <>
                <li><button onClick={toggleAuth}>Войти</button></li>
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