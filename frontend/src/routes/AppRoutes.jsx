import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Импорт компонентов страниц
import HomePage from '../pages/HomePage';
import TourCatalogPage from '../pages/TourCatalogPage';
import ToursPage from '../pages/ToursPage';
import TourDetailPage from '../pages/TourDetailPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ProfilePage from '../pages/ProfilePage';
import OrdersPage from '../pages/OrdersPage';
import BookingPage from '../pages/BookingPage';
import SupportPage from '../pages/SupportPage';
import AdminPage from '../pages/AdminPage';
import AboutPage from '../pages/AboutPage';
import ContactsPage from '../pages/ContactsPage';

// Компонент для защищенных маршрутов
const ProtectedRoute = ({ children, redirectPath = '/login', requiredRole = null }) => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }
  
  if (requiredRole && user.roleId !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  // ID ролей
  const ADMIN_ROLE_ID = 1;
  const SUPPORT_ROLE_ID = 3;
  
  return (
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
      
      {/* Маршруты для авторизованных пользователей */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />
      
      <Route path="/orders" element={
        <ProtectedRoute>
          <OrdersPage />
        </ProtectedRoute>
      } />
      
      <Route path="/booking/:tourId/:dateId" element={
        <ProtectedRoute>
          <BookingPage />
        </ProtectedRoute>
      } />
      
      <Route path="/support" element={
        <ProtectedRoute>
          <SupportPage />
        </ProtectedRoute>
      } />
      
      {/* Маршруты для администраторов */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole={ADMIN_ROLE_ID}>
          <AdminPage />
        </ProtectedRoute>
      } />
      
      {/* Маршрут 404 */}
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
};

export default AppRoutes; 