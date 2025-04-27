import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Импорт компонентов страниц
import HomePage from '../pages/HomePage';
import TourListPage from '../pages/TourListPage';
import TourDetailPage from '../pages/TourDetailPage';
import HotelListPage from '../pages/HotelListPage';
import HotelDetailPage from '../pages/HotelDetailPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ProfilePage from '../pages/ProfilePage';
import OrderListPage from '../pages/OrderListPage';
import OrderDetailPage from '../pages/OrderDetailPage';
import BookingPage from '../pages/BookingPage';
import SupportPage from '../pages/SupportPage';
import SupportTicketPage from '../pages/SupportTicketPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import AdminUserPage from '../pages/AdminUserPage';
import AdminTourPage from '../pages/AdminTourPage';
import AdminHotelPage from '../pages/AdminHotelPage';
import AdminOrderPage from '../pages/AdminOrderPage';
import AdminSupportPage from '../pages/AdminSupportPage';
import AboutPage from '../pages/AboutPage';
import ContactsPage from '../pages/ContactsPage';
import NotFoundPage from '../pages/NotFoundPage';

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
      <Route path="/tours" element={<TourListPage />} />
      <Route path="/tours/:id" element={<TourDetailPage />} />
      <Route path="/hotels" element={<HotelListPage />} />
      <Route path="/hotels/:id" element={<HotelDetailPage />} />
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
          <OrderListPage />
        </ProtectedRoute>
      } />
      
      <Route path="/orders/:id" element={
        <ProtectedRoute>
          <OrderDetailPage />
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
      
      <Route path="/support/tickets/:id" element={
        <ProtectedRoute>
          <SupportTicketPage />
        </ProtectedRoute>
      } />
      
      {/* Маршруты для администраторов */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole={ADMIN_ROLE_ID}>
          <AdminDashboardPage />
        </ProtectedRoute>
      } />
      
      <Route path="/admin/users" element={
        <ProtectedRoute requiredRole={ADMIN_ROLE_ID}>
          <AdminUserPage />
        </ProtectedRoute>
      } />
      
      <Route path="/admin/tours" element={
        <ProtectedRoute requiredRole={ADMIN_ROLE_ID}>
          <AdminTourPage />
        </ProtectedRoute>
      } />
      
      <Route path="/admin/hotels" element={
        <ProtectedRoute requiredRole={ADMIN_ROLE_ID}>
          <AdminHotelPage />
        </ProtectedRoute>
      } />
      
      <Route path="/admin/orders" element={
        <ProtectedRoute requiredRole={ADMIN_ROLE_ID}>
          <AdminOrderPage />
        </ProtectedRoute>
      } />
      
      <Route path="/admin/support" element={
        <ProtectedRoute requiredRole={ADMIN_ROLE_ID}>
          <AdminSupportPage />
        </ProtectedRoute>
      } />
      
      {/* Маршруты для сотрудников тех-поддержки */}
      <Route path="/support/tickets" element={
        <ProtectedRoute requiredRole={SUPPORT_ROLE_ID}>
          <AdminSupportPage />
        </ProtectedRoute>
      } />
      
      {/* Маршрут 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes; 