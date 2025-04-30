import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import store from './store';
import { getUserProfile } from './store/auth/authSlice';
import { useSelector } from 'react-redux';

import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import TourCatalogPage from './pages/TourCatalogPage';
import ToursPage from './pages/ToursPage';
import TourDetailPage from './pages/TourDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import BookingPage from './pages/BookingPage';
import BookingSuccessPage from './pages/BookingSuccessPage';
import SupportPage from './pages/SupportPage';
import AdminPage from './pages/AdminPage';
import AboutPage from './pages/AboutPage';
import ContactsPage from './pages/ContactsPage';

import './App.css';

// Компонент для логирования изменений маршрута
const RouteLogger = () => {
  const location = useLocation();
  
  useEffect(() => {
    console.log('App - текущий URL:', window.location.href);
    console.log('App - текущий путь:', location.pathname);
    console.log('App - текущие параметры:', location.search);
    console.log('App - текущее состояние:', location.state);
  }, [location]);
  
  return null;
};

// Компонент для защищенных маршрутов
const ProtectedRoute = ({ children, redirectPath = '/login' }) => {
  const { isAuthenticated } = useSelector(state => state.auth);
  const location = useLocation();
  
  console.log('ProtectedRoute - проверка аутентификации:', isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} state={{ from: location.pathname }} replace />;
  }
  
  return children;
};

// Специальный компонент-обработчик для маршрута /booking с параметрами
const BookingRouteHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const search = location.search;
  
  console.log('BookingRouteHandler - обработка маршрута:', location.pathname, 'с параметрами:', search);
  
  // Если нет параметров поиска, просто показываем BookingPage
  if (!search) {
    return <BookingPage />;
  }
  
  // Получаем параметры и проверяем их
  const searchParams = new URLSearchParams(search);
  const tourId = searchParams.get('tourId');
  const tourDateId = searchParams.get('tourDateId');
  
  // Если отсутствуют необходимые параметры, перенаправляем на страницу туров
  if (!tourId || !tourDateId) {
    console.log('BookingRouteHandler - отсутствуют необходимые параметры, перенаправление на /tours');
    navigate('/tours', { replace: true });
    return null;
  }
  
  console.log('BookingRouteHandler - параметры валидны, отображаем BookingPage');
  return <BookingPage />;
};

// Компонент для содержимого приложения
const AppContent = () => {
  const location = useLocation();
  
  useEffect(() => {
    console.log('AppContent - инициализация, путь:', location.pathname);
    
    // Проверяем, авторизован ли пользователь при загрузке приложения
    if (localStorage.getItem('accessToken')) {
      console.log('AppContent - токен доступа найден, запрос профиля пользователя');
      store.dispatch(getUserProfile());
    } else {
      console.log('AppContent - токен доступа не найден');
    }
    
    // Обработка параметров URL для бронирования
    if (location.pathname === '/booking' && !location.search) {
      console.log('AppContent - обнаружен маршрут /booking без параметров');
    }
  }, [location.pathname]);

  return (
    <div className="app">
      <RouteLogger />
      <Header />
      <main className="main-content">
        <Routes>
          {/* Публичные маршруты */}
          <Route path="/" element={<HomePage />} />
          <Route path="/tours" element={<ToursPage />} />
          <Route path="/tours/catalog" element={<TourCatalogPage />} />
          <Route path="/tours/:id" element={<TourDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          
          {/* Обработчик маршрута бронирования */}
          <Route path="/booking" element={<BookingRouteHandler />} />
          
          {/* Успешное бронирование */}
          <Route path="/booking/success" element={
            <ProtectedRoute>
              <BookingSuccessPage />
            </ProtectedRoute>
          } />
          
          {/* Маршруты для авторизованных пользователей */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          
          <Route path="/profile/orders" element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          } />
          
          <Route path="/orders" element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          } />
          
          <Route path="/support" element={
            <ProtectedRoute>
              <SupportPage />
            </ProtectedRoute>
          } />
          
          {/* Маршруты для администраторов */}
          <Route path="/admin/*" element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          } />
          
          {/* Маршрут 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

function App() {
  console.log('App - инициализация компонента');
  
  useEffect(() => {
    // Обработка потенциально проблемных URL при загрузке
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    
    console.log('App - загрузка, текущий путь:', currentPath, 'поиск:', currentSearch);
    
    // Исправление URL при наличии undefined параметров
    if (currentSearch.includes('undefined')) {
      console.log('App - найдены неопределенные значения в URL, исправляем');
      
      const searchParams = new URLSearchParams(currentSearch);
      let hasChanges = false;
      
      Array.from(searchParams.entries()).forEach(([key, value]) => {
        if (value === 'undefined') {
          searchParams.delete(key);
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        // Создаем новый URL без undefined параметров
        const newSearch = searchParams.toString();
        const newUrl = `${currentPath}${newSearch ? `?${newSearch}` : ''}`;
        
        console.log('App - исправленный URL:', newUrl);
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, []);
  
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App; 