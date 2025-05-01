import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './HomePage.css';

// Импорт изображений - этот способ не требуется при использовании папки public
// import baliImage from '../assets/images/bali.jpg';
// import europeImage from '../assets/images/europe.jpg';
// import egyptImage from '../assets/images/egypt.jpg';
// import japanImage from '../assets/images/japan.jpg';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Состояния для формы поиска
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [guests, setGuests] = useState('1'); // По умолчанию 1 гость

  // Данные для популярных направлений (эмуляция данных с API)
  const popularDestinations = [
    { 
      id: 1, 
      name: 'Таиланд', 
      location: 'Юго-Восточная Азия', 
      image: '/images/tours/thailand_paradise.jpg',
      price: 85000,
      badge: 'Хит продаж'
    },
    { 
      id: 2, 
      name: 'Турция', 
      location: 'Анталия, Средиземное море', 
      image: '/images/tours/istanbul_historic.jpg', // Используем Стамбул для Турции
      price: 45000,
      badge: 'Популярно'
    },
    { 
      id: 3, 
      name: 'Бали', 
      location: 'Индонезия', 
      image: '/images/tours/bali.jpg',
      price: 120000,
      badge: 'Экзотика'
    },
    { 
      id: 4, 
      name: 'Италия', 
      location: 'Рим, Венеция, Флоренция', 
      image: '/images/tours/Italy.jpg',
      price: 90000
    }
  ];

  // Данные для секции с преимуществами
  const features = [
    {
      icon: 'fas fa-globe',
      title: 'Надежность',
      description: 'С нами вы всегда отправитесь в поездку без лишних проблем. Гарантия безопасности и комфорта.'
    },
    {
      icon: 'fas fa-star',
      title: 'Опыт',
      description: 'Мы обслужили уже тысячи туристов и все остались довольны качеством предоставленных услуг.'
    },
    {
      icon: 'fas fa-gem',
      title: 'Качество',
      description: 'Наши технологии отработаны до совершенства, что гарантирует высокое качество обслуживания.'
    },
    {
      icon: 'fas fa-dollar-sign',
      title: 'Лучшие цены',
      description: 'Мы работаем напрямую с отелями и перевозчиками, что позволяет нам предлагать лучшие цены.'
    }
  ];

  // Данные для отзывов клиентов
  const testimonials = [
    {
      content: 'Отличная компания! Отдыхали с семьей в Турции, все было организовано на высшем уровне. Обязательно обратимся еще раз.',
      author: 'Анна Петрова',
      location: 'Москва',
      avatar: 'https://placehold.co/100x100/195383/ffffff?text=АП'
    },
    {
      content: 'Впервые воспользовался услугами этой компании для поездки в Таиланд. Остался очень доволен, всё четко и без накладок.',
      author: 'Иван Соколов',
      location: 'Санкт-Петербург',
      avatar: 'https://placehold.co/100x100/195383/ffffff?text=ИС'
    },
    {
      content: 'Прекрасный сервис и отличные менеджеры, которые всегда готовы помочь. Рекомендую всем, кто планирует отдых!',
      author: 'Елена Смирнова',
      location: 'Екатеринбург',
      avatar: 'https://placehold.co/100x100/195383/ffffff?text=ЕС'
    }
  ];

  // Функция для форматирования цены
  const formatPrice = (price: number): string => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  // Обработчик отправки формы поиска
  const handleSearchSubmit = () => {
    // Формируем строку запроса
    const queryParams = new URLSearchParams();
    if (destination) queryParams.append('destination', destination);
    if (date) queryParams.append('date', date);
    if (guests) queryParams.append('guests', guests);

    // Перенаправляем на страницу каталога с параметрами
    navigate(`/tours?${queryParams.toString()}`);
  };

  return (
    <div className="home-page">
      {/* Секция с баннером */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <h1 className="hero-title">Открой мир вместе с нами</h1>
            <p className="hero-subtitle">Лучшие туры на любой вкус и бюджет от надежного туроператора</p>
            
            <div className="search-form">
              <h2 className="search-form-title">Найдите идеальный тур</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="destination">Куда</label>
                  <select
                    id="destination"
                    className="form-control"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  >
                    <option value="">Выберите направление</option>
                    <option value="turkey">Турция</option>
                    <option value="egypt">Египет</option>
                    <option value="thailand">Таиланд</option>
                    <option value="italy">Италия</option>
                    <option value="spain">Испания</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="date">Дата вылета</label>
                  <input 
                    type="date" 
                    id="date"
                    className="form-control"
                    min={new Date().toISOString().split('T')[0]}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="guests">Количество человек</label>
                  <select
                    id="guests"
                    className="form-control"
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5+</option>
                  </select>
                </div>
              </div>
              
              <button type="button" className="search-btn" onClick={handleSearchSubmit}>Найти тур</button>
            </div>
          </div>
        </div>
        
        <div className="hero-waves">
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
        </div>
      </section>

      {/* Секция с популярными направлениями */}
      <section className="popular-destinations">
        <div className="container">
          <h2 className="section-title">Популярные направления</h2>
          
          <div className="destinations-grid">
            {popularDestinations.map((destination) => (
              <div className="destination-card" key={destination.id}>
                <div className="destination-img">
                  <img src={destination.image} alt={destination.name} />
                  {destination.badge && (
                    <span className="destination-badge">{destination.badge}</span>
                  )}
                </div>
                <div className="destination-content">
                  <h3 className="destination-title">{destination.name}</h3>
                  <div className="destination-location">
                    <i className="fas fa-map-marker-alt"></i> {destination.location}
                  </div>
                  <div className="destination-price">
                    от {formatPrice(destination.price)} ₽ <small>/ человека</small>
                  </div>
                  <Link to={`/tours/${destination.id}`} className="tour-button">
                    Подробнее
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
          <Link to="/tours" className="view-all-btn">
            Показать все направления
          </Link>
        </div>
      </section>

      {/* Секция с преимуществами */}
      <section className="features-section">
        <div className="features-bg"></div>
        <div className="container">
          <h2 className="section-title">Почему именно ПланетаТур?</h2>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div className="feature-card" key={index}>
                <div className="feature-icon">
                  <i className={feature.icon}></i>
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Секция с призывом к действию */}
      <section className="cta-section">
        <div className="cta-bg"></div>
        <div className="container cta-container">
          <h2 className="cta-title">Давайте начнем ваше путешествие!</h2>
          <p className="cta-subtitle">По самой доступной цене мы организуем ваш идеальный отдых</p>
          <Link to="/tours" className="cta-btn">Забронировать тур</Link>
        </div>
      </section>

      {/* Секция с отзывами */}
      <section className="testimonials-section">
        <div className="container testimonials-container">
          <h2 className="section-title">Отзывы наших клиентов</h2>
          
          <div className="testimonial-cards">
            {testimonials.map((testimonial, index) => (
              <div className="testimonial-card" key={index}>
                <p className="testimonial-content">{testimonial.content}</p>
                <div className="testimonial-author">
                  <div className="author-avatar">
                    <img src={testimonial.avatar} alt={testimonial.author} />
                  </div>
                  <div className="author-info">
                    <div className="author-name">{testimonial.author}</div>
                    <div className="author-location">{testimonial.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 