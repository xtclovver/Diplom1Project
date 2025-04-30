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
import BookingPage from './pages/BookingPage';
import BookingSuccessPage from './pages/BookingSuccessPage';
import SupportPage from './pages/SupportPage';
import AdminPage from './pages/AdminPage';
import AboutPage from './pages/AboutPage';
import ContactsPage from './pages/ContactsPage';
import './App.css';

const ProtectedRoute = ({ children, redirectPath = '/login', requiredRole = null }: {
  children: JSX.Element;
  redirectPath?: string;
  requiredRole?: number | null;
}) => {
  const { isAuthenticated, user } = useSelector((state: { auth: { isAuthenticated: boolean; user: { roleId?: number } | null } }) => state.auth);
  const location = useLocation();

  console.log(`ProtectedRoute: Path=${location.pathname}, IsAuth=${isAuthenticated}, RequiredRole=${requiredRole}, UserRole=${user?.roleId}`);

  if (!isAuthenticated) {
    console.log(`ProtectedRoute: Not authenticated, redirecting to ${redirectPath}`);
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }
  
  if (requiredRole && user?.roleId !== requiredRole) {
    console.log(`ProtectedRoute: Role mismatch (required ${requiredRole}, user has ${user?.roleId}), redirecting to /`);
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
  );
};

export default App;