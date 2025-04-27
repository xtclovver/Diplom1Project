import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

const Header: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string>('');
  const navigate = useNavigate();

  // Заглушка для функции выхода
  const handleLogout = () => {
    // Здесь будет логика выхода
    setIsLoggedIn(false);
    setUserRole('');
    navigate('/');
  };

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
            {isLoggedIn ? (
              <>
                <li><Link to="/orders">Мои заказы</Link></li>
                <li><Link to="/support">Тех. поддержка</Link></li>
                {userRole === 'admin' && (
                  <li><Link to="/admin">Админ панель</Link></li>
                )}
                <li><Link to="/profile">Профиль</Link></li>
                <li><button onClick={handleLogout}>Выйти</button></li>
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