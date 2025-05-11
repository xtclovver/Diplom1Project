import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { getUserProfile } from './store/auth/authSlice';
import store from './store';
import App from './App';
import './index.css';

// Добавляем Font Awesome
const fontAwesome = document.createElement('link');
fontAwesome.rel = 'stylesheet';
fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.3.0/css/all.min.css';
document.head.appendChild(fontAwesome);

// Проверяем состояние авторизации и загружаем приложение
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Загружаем данные из redux store для проверки
const { auth } = store.getState();
const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

// Запускаем получение данных пользователя только если:
// 1. Есть токен, и
// 2. Пользователь ещё не авторизован, и 
// 3. Сейчас не идет загрузка
if (token && !auth.isAuthenticated && !auth.loading) {
  console.log('[Index] Обнаружен токен, инициируем первичную загрузку данных пользователя');
  
  // Запускаем загрузку данных один раз при старте
  store.dispatch(getUserProfile() as any)
    .finally(() => {
      // Рендерим приложение независимо от результата запроса
      renderApp();
    });
} else {
  // Если нет токена или пользователь уже авторизован, просто рендерим приложение
  if (!token) {
    console.log('[Index] Токен не найден, пропускаем загрузку данных пользователя');
  } else if (auth.isAuthenticated) {
    console.log('[Index] Пользователь уже авторизован, пропускаем загрузку данных');
  } else if (auth.loading) {
    console.log('[Index] Загрузка данных пользователя уже идет, пропускаем повторную загрузку');
  }
  renderApp();
}

function renderApp() {
  root.render(
    <React.StrictMode>
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    </React.StrictMode>
  );
} 