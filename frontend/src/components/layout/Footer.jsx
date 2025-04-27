import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__content">
          <div className="footer__section">
            <h3 className="footer__title">Туристическое агентство</h3>
            <p className="footer__description">
              Мы организуем лучшие туры по всему миру с 2010 года. Наша цель - сделать ваш отдых незабываемым!
            </p>
          </div>
          <div className="footer__section">
            <h3 className="footer__title">Навигация</h3>
            <ul className="footer__nav">
              <li><Link to="/">Главная</Link></li>
              <li><Link to="/tours">Туры</Link></li>
              <li><Link to="/hotels">Отели</Link></li>
              <li><Link to="/about">О нас</Link></li>
              <li><Link to="/contacts">Контакты</Link></li>
            </ul>
          </div>
          <div className="footer__section">
            <h3 className="footer__title">Контакты</h3>
            <address className="footer__address">
              <p>123456, Россия, г. Москва</p>
              <p>ул. Путешественников, д. 10</p>
              <p>Email: info@tour-agency.ru</p>
              <p>Телефон: +7 (123) 456-78-90</p>
            </address>
          </div>
          <div className="footer__section">
            <h3 className="footer__title">Мы в социальных сетях</h3>
            <div className="footer__social">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
              <a href="https://vk.com" target="_blank" rel="noopener noreferrer">VK</a>
            </div>
          </div>
        </div>
        <div className="footer__bottom">
          <p className="footer__copyright">
            &copy; {new Date().getFullYear()} Туристическое агентство. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 