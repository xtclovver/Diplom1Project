import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <span className="footer-logo-text">ПланетаТур</span>
            </div>
            <p className="footer-description">
              Мы организуем лучшие туры по всему миру с 2010 года. Наша цель - сделать ваш отдых незабываемым и комфортным!
            </p>
            <div className="footer-social">
              <a href="#" className="social-icon" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-vk"></i>
              </a>
              <a href="#" className="social-icon" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-telegram-plane"></i>
              </a>
              <a href="#" className="social-icon" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="social-icon" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-facebook-f"></i>
              </a>
            </div>
          </div>
          
          <div className="footer-section">
            <h3 className="footer-title">Навигация</h3>
            <ul className="footer-nav">
              <li><Link to="/">Главная</Link></li>
              <li><Link to="/tours">Туры</Link></li>
              <li><Link to="/about">О нас</Link></li>
              <li><Link to="/contacts">Контакты</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3 className="footer-title">Направления</h3>
            <ul className="footer-nav">
              <li><Link to="/tours/europe">Европа</Link></li>
              <li><Link to="/tours/asia">Азия</Link></li>
              <li><Link to="/tours/africa">Африка</Link></li>
              <li><Link to="/tours/america">Америка</Link></li>
              <li><Link to="/tours/russia">Россия</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3 className="footer-title">Контакты</h3>
            <address className="footer-address">
              <p><i className="fas fa-map-marker-alt"></i> 123456, Пенза, ул. Московская 38, этаж 2</p>
              <p><i className="fas fa-phone"></i> +7 (8412) 232-000</p>
              <p><i className="fas fa-envelope"></i> planeta@rem-str.ru</p>
              <p><i className="fas fa-clock"></i> Пн-Пт: 10:00-19:00, Сб: 10:00-17:00</p>
            </address>
            
            <div className="footer-newsletter">
              <h4 className="newsletter-title">Подпишитесь на новости</h4>
              <form className="newsletter-form">
                <input 
                  type="email" 
                  className="newsletter-input" 
                  placeholder="Ваш email" 
                  required 
                />
                <button type="submit" className="newsletter-btn">
                  <i className="fas fa-paper-plane"></i>
                </button>
              </form>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} ПланетаТур. Все права защищены.</p>
        </div>
        
        <div className="footer-policy">
          <Link to="/policy">Политика конфиденциальности</Link>
          <Link to="/terms">Условия использования</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 