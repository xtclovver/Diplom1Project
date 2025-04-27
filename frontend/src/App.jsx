import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import store from './store';
import { getUserProfile } from './store/auth/authSlice';

import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import AppRoutes from './routes/AppRoutes';
import './App.css';

function App() {
  useEffect(() => {
    // Проверяем, авторизован ли пользователь при загрузке приложения
    if (localStorage.getItem('accessToken')) {
      store.dispatch(getUserProfile());
    }
  }, []);

  return (
    <BrowserRouter>
      <div className="app">
        <Header />
        <main className="main-content">
          <AppRoutes />
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App; 