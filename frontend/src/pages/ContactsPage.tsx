import React, { useState } from 'react';
import './ContactsPage.css';
import { contactsHero } from '../assets/images';

const ContactsPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [formStatus, setFormStatus] = useState({
    submitted: false,
    error: false,
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Имитируем отправку формы и успешный ответ
    setFormStatus({
      submitted: true,
      error: false,
      message: 'Спасибо за ваше сообщение! Мы свяжемся с вами в ближайшее время.'
    });
    // Сбросить форму
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
  };

  return (
    <div className="contacts-page">
      <div className="contacts-hero">
        <div className="container">
          <h1>Связаться с нами</h1>
          <p className="contacts-subtitle">Мы всегда на связи и готовы ответить на ваши вопросы</p>
        </div>
      </div>

      <div className="container">
        <section className="contacts-info-section">
          <div className="contacts-info-grid">
            <div className="contact-card">
              <div className="contact-icon">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <h3>Наш адрес</h3>
              <p>123456, Пенза, ул. Московская 38, этаж 2</p>
              <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="contact-link">
                Показать на карте <i className="fas fa-arrow-right"></i>
              </a>
            </div>

            <div className="contact-card">
              <div className="contact-icon">
                <i className="fas fa-phone-alt"></i>
              </div>
              <h3>Телефоны</h3>
              <p>+7 (8412) 232-000 - Основной офис</p>
              <p>+7 (8412) 232-001 - Отдел бронирования</p>
              <p>+7 (8412) 232-002 - Тех.поддержка</p>
            </div>

            <div className="contact-card">
              <div className="contact-icon">
                <i className="fas fa-envelope"></i>
              </div>
              <h3>Электронная почта</h3>
              <p>planeta@rem-str.ru - Общие вопросы</p>
              <p>booking@rem-str.ru - Бронирование</p>
              <p>support@rem-str.ru - Тех.поддержка</p>
            </div>

            <div className="contact-card">
              <div className="contact-icon">
                <i className="fas fa-clock"></i>
              </div>
              <h3>Режим работы</h3>
              <p>Понедельник - Пятница: 10:00 - 19:00</p>
              <p>Суббота: 10:00 - 17:00</p>
              <p>Воскресенье: выходной</p>
            </div>
          </div>
        </section>

        <section className="map-section">
          <h2 className="section-title">Как нас найти</h2>
          <div className="map-container">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2386.1466555626383!2d45.01736671580302!3d53.18716649935977!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4141a7cf236c0001%3A0xfdf9f21b3c9e9a30!2z0YPQuy4g0JzQvtGB0LrQvtCy0YHQutCw0Y8sIDM4LCDQn9C10L3Qt9CwLCDQn9C10L3Qt9C10L3RgdC60LDRjyDQvtCx0LsuLCA0NDAwMDA!5e0!3m2!1sru!2sru!4v1601975487254!5m2!1sru!2sru"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Карта расположения офиса ПланетаТур"
            ></iframe>
          </div>
        </section>

        <section className="contact-form-section">
          <div className="form-container">
            <div className="form-header">
              <h2>Отправить сообщение</h2>
              <p>
                Если у вас есть вопросы, заполните форму ниже, и наши специалисты свяжутся с вами в ближайшее время
              </p>
            </div>

            {formStatus.submitted ? (
              <div className="form-success">
                <div className="success-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <h3>Сообщение отправлено!</h3>
                <p>{formStatus.message}</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setFormStatus({ submitted: false, error: false, message: '' })}
                >
                  Отправить новое сообщение
                </button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Ваше имя *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Иван Иванов"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="example@mail.ru"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Телефон</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+7 (999) 123-45-67"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="subject">Тема сообщения *</label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Выберите тему</option>
                      <option value="booking">Бронирование тура</option>
                      <option value="info">Информация о турах</option>
                      <option value="partnership">Сотрудничество</option>
                      <option value="complaint">Жалоба</option>
                      <option value="other">Другое</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Сообщение *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    placeholder="Напишите ваше сообщение здесь..."
                    rows={6}
                  ></textarea>
                </div>

                <div className="form-footer">
                  <p className="form-disclaimer">
                    * Поля, обязательные для заполнения. Отправляя сообщение, вы соглашаетесь с{' '}
                    <a href="/policy">политикой конфиденциальности</a>.
                  </p>
                  <button type="submit" className="btn btn-primary form-submit">
                    Отправить сообщение
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        <section className="social-section">
          <h2 className="section-title">Мы в социальных сетях</h2>
          <div className="social-container">
            <a href="#" className="social-link" target="_blank" rel="noopener noreferrer">
              <div className="social-icon">
                <i className="fab fa-vk"></i>
              </div>
              <span>ВКонтакте</span>
            </a>
            <a href="#" className="social-link" target="_blank" rel="noopener noreferrer">
              <div className="social-icon">
                <i className="fab fa-telegram-plane"></i>
              </div>
              <span>Telegram</span>
            </a>
            <a href="#" className="social-link" target="_blank" rel="noopener noreferrer">
              <div className="social-icon">
                <i className="fab fa-instagram"></i>
              </div>
              <span>Instagram</span>
            </a>
            <a href="#" className="social-link" target="_blank" rel="noopener noreferrer">
              <div className="social-icon">
                <i className="fab fa-facebook-f"></i>
              </div>
              <span>Facebook</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ContactsPage; 