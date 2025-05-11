import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import ToursPage from './pages/ToursPage';
import TourDetailPage from './pages/TourDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import BookingPage from './pages/BookingPage';
import BookingSuccessPage from './pages/BookingSuccessPage';
import SupportPage from './pages/SupportPage';
import AdminPage from './pages/AdminPage';
import AdminToursPage from './pages/AdminToursPage';
import AboutPage from './pages/AboutPage';
import ContactsPage from './pages/ContactsPage';
import AuthInitializer from './components/auth/AuthInitializer';
import './App.css';

// Функция для проверки, является ли пользователь администратором
const isUserAdmin = (user: any): boolean => {
  if (!user) return false;
  
  // Проверяем разные варианты структуры объекта пользователя
  if (user.role && user.role.name === 'admin') return true;
  if (user.role && user.role.name === 'админ') return true;
  if (user.roleId === 1) return true;
  if (user.username === 'admin') return true;
  if (user.role === 'admin') return true;
  
  console.log('[ProtectedRoute] Проверка администратора:', user);
  
  return false;
};

const ProtectedRoute = ({ children, redirectPath = '/login', requiredRole = null }: {
  children: JSX.Element;
  redirectPath?: string;
  requiredRole?: number | null;
}) => {
  const { isAuthenticated, user } = useSelector((state: { auth: { isAuthenticated: boolean; user: any } }) => state.auth);
  const location = useLocation();

  console.log(`ProtectedRoute: Path=${location.pathname}, IsAuth=${isAuthenticated}, RequiredRole=${requiredRole}`);

  // Добавляем проверку состояния инициализации авторизации
  // Если данные пользователя еще загружаются, показываем загрузку вместо редиректа
  const authLoading = useSelector((state: any) => state.auth.loading);
  
  if (authLoading) {
    console.log('ProtectedRoute: Auth state is loading, showing loading screen');
    return <div className="auth-loading">Загрузка...</div>;
  }

  if (!isAuthenticated) {
    console.log(`ProtectedRoute: Not authenticated, redirecting to ${redirectPath}`);
    return <Navigate to={redirectPath} state={{ from: location.pathname + location.search }} replace />;
  }
  
  // Для админ-маршрутов (requiredRole === 1) проверяем, является ли пользователь администратором
  if (requiredRole === 1 && !isUserAdmin(user)) {
    console.log(`ProtectedRoute: User is not admin, redirecting to /`);
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const App: React.FC = () => {
  console.log("App component rendering - This is the active router config.");
  const location = useLocation();

  useEffect(() => {
    console.log("App Route changed:", location.pathname + location.search);
  }, [location]);

  const ADMIN_ROLE_ID = 1;

  return (
    <>
      {/* Добавляем компонент для инициализации авторизации */}
      <AuthInitializer />
      
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="tours" element={<ToursPage />} />
          <Route path="tours/:id" element={<TourDetailPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contacts" element={<ContactsPage />} />

          <Route path="profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="profile/orders" element={ 
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          } />
          <Route path="orders" element={ 
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          } />
          <Route path="orders/:id" element={ 
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
          } />
          <Route path="support" element={
            <ProtectedRoute>
              <SupportPage />
            </ProtectedRoute>
          } />
          <Route path="booking" element={
            <ProtectedRoute>
              <BookingPage />
            </ProtectedRoute>
          } />
          <Route path="booking/success" element={
            <ProtectedRoute>
              <BookingSuccessPage />
            </ProtectedRoute>
          } />

          <Route path="admin/tours" element={
            <ProtectedRoute requiredRole={ADMIN_ROLE_ID}>
              <AdminToursPage />
            </ProtectedRoute>
          } />

          <Route path="admin/*" element={
            <ProtectedRoute requiredRole={ADMIN_ROLE_ID}>
              <AdminPage /> 
            </ProtectedRoute>
          } />
        </Route>

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;