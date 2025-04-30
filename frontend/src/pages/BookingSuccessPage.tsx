import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { resetCreateOrderSuccess } from '../store/order/orderSlice';
import { useAppDispatch } from '../store/hooks';
import './BookingSuccessPage.css';

const BookingSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { order, createOrderSuccess } = useSelector((state: any) => state.order);
  
  useEffect(() => {
    // Добавляем конфетти на страницу успеха
    function showConfetti() {
      const confettiCount = 200;
      const container = document.querySelector('.booking-success-page');
      
      if (container) {
        for (let i = 0; i < confettiCount; i++) {
          const confetti = document.createElement('div');
          confetti.classList.add('confetti');
          
          // Случайный цвет
          const colors = ['#4c94fc', '#ff9800', '#8bc34a', '#e91e63', '#9c27b0'];
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          confetti.style.backgroundColor = randomColor;
          
          // Случайное положение
          confetti.style.left = Math.random() * 100 + 'vw';
          confetti.style.animationDelay = Math.random() * 3 + 's';
          confetti.style.animationDuration = Math.random() * 3 + 2 + 's';
          
          container.appendChild(confetti);
          
          // Удаляем конфетти после анимации
          setTimeout(() => {
            if (container.contains(confetti)) {
              container.removeChild(confetti);
            }
          }, 5000);
        }
      }
    };
    
    // Если пользователь попал на эту страницу без успешного создания заказа и нет данных заказа,
    // перенаправляем на список туров
    if (!createOrderSuccess && !order) {
      console.log('Нет данных заказа, перенаправление на список туров');
      navigate('/tours');
    } else {
      // Показываем конфетти при успешном бронировании
      showConfetti();
    }
    
    // Сбрасываем флаг успешного создания заказа при размонтировании компонента
    return () => {
      dispatch(resetCreateOrderSuccess());
    };
  }, [createOrderSuccess, order, navigate, dispatch]);
  
  return (
    <div className="booking-success-page">
      <div className="success-container">
        <div className="success-icon">
          <i className="fa fa-check-circle"></i>
        </div>
        
        <h1>Бронирование успешно оформлено!</h1>
        
        <div className="order-info">
          <p className="order-number">Номер заказа: <strong>#{order?.id || 'Обрабатывается'}</strong></p>
          <p>Мы отправили детали вашего заказа на указанный email.</p>
          <p>В ближайшее время наш менеджер свяжется с вами для подтверждения бронирования.</p>
        </div>
        
        <div className="payment-status">
          <div className="status-icon paid">
            <i className="fa fa-credit-card"></i>
          </div>
          <div className="status-text">
            <h3>Статус оплаты</h3>
            <p>Оплачено</p>
          </div>
        </div>
        
        <div className="next-steps">
          <h3>Что дальше?</h3>
          <ul>
            <li>
              <i className="fa fa-envelope"></i>
              <span>Проверьте свою электронную почту для получения подтверждения</span>
            </li>
            <li>
              <i className="fa fa-phone"></i>
              <span>Ожидайте звонка от нашего менеджера для подтверждения деталей</span>
            </li>
            <li>
              <i className="fa fa-suitcase"></i>
              <span>Готовьтесь к незабываемому путешествию!</span>
            </li>
          </ul>
        </div>
        
        <div className="success-actions">
          <Link to="/profile/orders" className="view-orders-btn">
            <i className="fa fa-list-ul"></i> Мои заказы
          </Link>
          <Link to="/" className="back-home-btn">
            <i className="fa fa-home"></i> На главную
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccessPage; 