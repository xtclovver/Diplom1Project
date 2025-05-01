import React from 'react';
import { Link } from 'react-router-dom';
import './AboutPage.css';
import { about, aboutHistory, aboutTeam } from '../assets/images';

const AboutPage: React.FC = () => {
  return (
    <div className="about-page">
      <div className="about-hero">
        <div className="container">
          <h1>О компании АльфаТрэвел</h1>
          <p className="about-subtitle">С 2010 года создаем незабываемые путешествия для вас</p>
        </div>
      </div>

      <div className="container">
        <section className="about-section">
          <div className="about-grid">
            <div className="about-content">
              <h2>Наша история</h2>
              <p>
                Туристическое агентство <strong>АльфаТрэвел</strong> было основано в 2010 году группой энтузиастов, 
                объединенных общей страстью – любовью к путешествиям. Мы начинали как небольшая компания, 
                специализирующаяся на турах по России, но быстро расширили свою географию.
              </p>
              <p>
                За 13 лет работы мы организовали более 15 000 путешествий и помогли десяткам тысяч клиентов 
                открыть для себя новые горизонты. Сегодня <strong>АльфаТрэвел</strong> – это команда профессионалов, 
                влюбленных в свое дело и постоянно стремящихся сделать ваш отдых незабываемым.
              </p>
            </div>
            <div className="about-image">
              <img src={aboutHistory} alt="История АльфаТрэвел" />
            </div>
          </div>
        </section>

        <section className="about-section values-section">
          <h2 className="section-title">Наши ценности</h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">
                <i className="fas fa-heart"></i>
              </div>
              <h3>Клиент в центре внимания</h3>
              <p>Мы ставим ваши интересы и потребности на первое место при планировании любого путешествия.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">
                <i className="fas fa-gem"></i>
              </div>
              <h3>Качество сервиса</h3>
              <p>Мы тщательно проверяем всех партнеров и предлагаем только лучшие варианты размещения и экскурсий.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">
                <i className="fas fa-handshake"></i>
              </div>
              <h3>Надежность</h3>
              <p>С нами вы можете быть уверены в безопасности путешествия и выполнении всех договоренностей.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">
                <i className="fas fa-lightbulb"></i>
              </div>
              <h3>Инновации</h3>
              <p>Мы постоянно ищем новые направления и форматы путешествий, чтобы удивлять даже опытных туристов.</p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <div className="about-grid reverse">
            <div className="about-image">
              <img src={aboutTeam} alt="Команда АльфаТрэвел" />
            </div>
            <div className="about-content">
              <h2>Наша команда</h2>
              <p>
                В <strong>АльфаТрэвел</strong> работают настоящие профессионалы туристической индустрии. 
                Наши сотрудники регулярно проходят обучение, посещают новые направления и отели, 
                чтобы предоставлять вам актуальную информацию и рекомендации из первых рук.
              </p>
              <p>
                Каждый член нашей команды – увлеченный путешественник с богатым личным опытом поездок 
                по разным странам и континентам. Мы знаем, как сделать ваше путешествие комфортным, 
                безопасным и запоминающимся.
              </p>
            </div>
          </div>
        </section>

        <section className="about-section facts-section">
          <h2 className="section-title">АльфаТрэвел в цифрах</h2>
          <div className="facts-grid">
            <div className="fact-card">
              <div className="fact-number">13+</div>
              <div className="fact-text">лет на рынке туризма</div>
            </div>
            <div className="fact-card">
              <div className="fact-number">15 000+</div>
              <div className="fact-text">организованных туров</div>
            </div>
            <div className="fact-card">
              <div className="fact-number">50+</div>
              <div className="fact-text">стран в нашем портфолио</div>
            </div>
            <div className="fact-card">
              <div className="fact-number">92%</div>
              <div className="fact-text">клиентов возвращаются к нам</div>
            </div>
          </div>
        </section>

        <section className="about-section cta-section">
          <div className="cta-container">
            <h2>Готовы отправиться в путешествие с нами?</h2>
            <p>Ознакомьтесь с нашими турами или свяжитесь с нами для консультации</p>
            <div className="cta-buttons">
              <Link to="/tours" className="btn btn-primary">Смотреть туры</Link>
              <Link to="/contacts" className="btn btn-outline">Связаться с нами</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage; 