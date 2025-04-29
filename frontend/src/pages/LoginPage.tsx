import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../store/auth/authSlice';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const authState = useSelector((state: any) => state.auth);
  const isAuthenticated = authState.isAuthenticated;
  
  // Отладочное логирование состояния аутентификации
  useEffect(() => {
    console.log('[LoginPage] Состояние аутентификации:', {
      isAuthenticated: authState.isAuthenticated,
      hasUser: !!authState.user,
      hasToken: !!authState.token,
      loading: authState.loading,
      error: authState.error
    });
    
    if (authState.user) {
      console.log('[LoginPage] Данные пользователя:', JSON.stringify(authState.user, null, 2));
    }
  }, [authState]);
  
  // Если пользователь уже авторизован, перенаправляем на профиль
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from || '/profile';
      console.log('[LoginPage] Перенаправление на:', from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }
    
    console.log('[LoginPage] Начало процесса авторизации');
    setLoading(true);
    setError('');
    
    try {
      console.log('[LoginPage] Отправка запроса на авторизацию');
      const result = await dispatch(login({ usernameOrEmail: username, password }) as any);
      console.log('[LoginPage] Результат авторизации:', result.meta.requestStatus);
      
      if (result.meta.requestStatus === 'fulfilled') {
        console.log('[LoginPage] Авторизация успешна');
        // Успешная авторизация - редирект осуществляется через useEffect
      } else if (result.payload) {
        console.error('[LoginPage] Ошибка авторизации:', result.payload);
        // В случае ошибки показываем сообщение
        setError(String(result.payload));
        
        // Предотвращаем потенциальные перенаправления или перезагрузки
        setTimeout(() => {
          if (loading) setLoading(false);
        }, 100);
      }
    } catch (err: any) {
      console.error('[LoginPage] Исключение при авторизации:', err);
      setError(err.message || 'Ошибка авторизации. Пожалуйста, попробуйте снова.');
    } finally {
      setLoading(false);
      console.log('[LoginPage] Завершение процесса авторизации');
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-wrapper">
        <h1>Вход в аккаунт</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Имя пользователя</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        
        <div className="login-links">
          <p>
            Еще нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 