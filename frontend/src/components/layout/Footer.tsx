import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-column">
            <h3>ТурАгенство</h3>
            <p>Ваш надежный партнер в мире путешествий. Мы делаем ваш отдых незабываемым!</p>
          </div>
          <div className="footer-column">
            <h3>Информация</h3>
            <ul>
              <li><Link to="/about">О нас</Link></li>
              <li><Link to="/contacts">Контакты</Link></li>
              <li><Link to="/terms">Условия и положения</Link></li>
              <li><Link to="/privacy">Политика конфиденциальности</Link></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Контакты</h3>
            <p>Адрес: ул. Туристическая, 1</p>
            <p>Телефон: +7 (123) 456-78-90</p>
            <p>Email: info@turagency.ru</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {currentYear} ТурАгенство. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 