import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/auth/authSlice';
import './Header.css';

const Header = () => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header__logo">
          <Link to="/">
            <h1>Туристическое агентство</h1>
          </Link>
        </div>
        <nav className="header__nav">
          <ul className="header__menu">
            <li className="header__menu-item">
              <Link to="/">Главная</Link>
            </li>
            <li className="header__menu-item">
              <Link to="/tours">Туры</Link>
            </li>
            <li className="header__menu-item">
              <Link to="/hotels">Отели</Link>
            </li>
            <li className="header__menu-item">
              <Link to="/about">О нас</Link>
            </li>
            <li className="header__menu-item">
              <Link to="/contacts">Контакты</Link>
            </li>
          </ul>
        </nav>
        <div className="header__auth">
          {isAuthenticated ? (
            <div className="header__user-menu">
              <span className="header__username">Привет, {user.username}!</span>
              <div className="header__dropdown">
                <button className="header__dropdown-btn">Профиль</button>
                <div className="header__dropdown-content">
                  <Link to="/profile">Мой профиль</Link>
                  <Link to="/orders">Мои заказы</Link>
                  <Link to="/support">Поддержка</Link>
                  {user.roleId === 1 && <Link to="/admin">Админ панель</Link>}
                  {user.roleId === 3 && <Link to="/support/tickets">Тикеты поддержки</Link>}
                  <button onClick={handleLogout}>Выйти</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="header__auth-buttons">
              <Link to="/login" className="header__login-btn">Войти</Link>
              <Link to="/register" className="header__register-btn">Регистрация</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 