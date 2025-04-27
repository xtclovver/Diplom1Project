import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

// Импорт изображений - этот способ не требуется при использовании папки public
// import baliImage from '../assets/images/bali.jpg';
// import europeImage from '../assets/images/europe.jpg';
// import egyptImage from '../assets/images/egypt.jpg';
// import japanImage from '../assets/images/japan.jpg';

const HomePage: React.FC = () => {
  // Данные для примера популярных туров
  const popularTours = [
    { id: 1, name: 'Пляж Бали', image: '/images/bali.jpg', price: 75000, rating: 4.8, days: 10 },
    { id: 2, name: 'Тур по Европе', image: '/images/europe.jpg', price: 120000, rating: 4.9, days: 14 },
    { id: 3, name: 'Пляж Египет', image: '/images/egypt.jpg', price: 45000, rating: 4.5, days: 7 },
    { id: 4, name: 'Тур по Японии', image: '/images/japan.jpg', price: 180000, rating: 5.0, days: 12 },
  ];

  return (
    <div className="home-page">
      {/* Секция с баннером */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1>Откройте мир с нами</h1>
            <p>Лучшие туры на любой вкус и бюджет</p>
            <div className="search-form">
              <h2>Найдите свой идеальный тур</h2>
              <div className="form-row">
                <div className="form-group">
                  <label>Куда</label>
                  <input type="text" placeholder="Город или страна" />
                </div>
                <div className="form-group">
                  <label>Дата отъезда</label>
                  <input type="date" />
                </div>
                <div className="form-group">
                  <label>Количество человек</label>
                  <select>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5+">5+</option>
                  </select>
                </div>
                <button className="search-btn">Найти</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Секция с популярными турами */}
      <section className="popular-tours-section">
        <div className="container">
          <h2>Популярные направления</h2>
          <div className="tours-grid">
            {popularTours.map(tour => (
              <div className="tour-card" key={tour.id}>
                <div className="tour-header">
                  <div className="tour-badge">Популярно</div>
                  <img src={tour.image} alt={tour.name} className="tour-image" />
                </div>
                <div className="tour-content">
                  <div className="tour-rating">
                    <span className="stars">★★★★★</span>
                    <span className="rating-value">{tour.rating}</span>
                  </div>
                  <h3>{tour.name}</h3>
                  <div className="tour-details">
                    <span className="tour-duration">{tour.days} дней</span>
                  </div>
                  <p className="tour-price">{tour.price.toLocaleString()} ₽</p>
                  <Link to={`/tours/${tour.id}`} className="tour-details-btn">
                    Подробнее
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="view-all">
            <Link to="/tours" className="view-all-btn">
              Показать все туры
            </Link>
          </div>
        </div>
      </section>

      {/* Секция с преимуществами */}
      <section className="features-section">
        <div className="container">
          <h2>Почему выбирают нас</h2>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">🌟</div>
              <h3>Лучшие цены</h3>
              <p>Мы гарантируем самые выгодные предложения на рынке</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🔒</div>
              <h3>Безопасность</h3>
              <p>Ваша безопасность - наш главный приоритет</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">👍</div>
              <h3>Проверенные отели</h3>
              <p>Только лучшие и проверенные отели</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🎁</div>
              <h3>Бонусы и скидки</h3>
              <p>Накопительная система скидок для постоянных клиентов</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 