import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getUserProfile } from '../../store/auth/authSlice';
import { RootState } from '../../store';

// Компонент для автоматической загрузки данных пользователя при старте приложения
const AuthInitializer: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, token, loading, user } = useSelector((state: RootState) => state.auth);
  // Добавляем ref для отслеживания, была ли уже выполнена инициализация
  const initializeAttempted = useRef(false);
  
  useEffect(() => {
    // Проверяем условия для загрузки:
    // 1. Есть токен
    // 2. Нет данных пользователя или не выставлен флаг isAuthenticated
    // 3. Не идет уже загрузка
    // 4. Не было предыдущих попыток инициализации
    if (token && !isAuthenticated && !loading && !initializeAttempted.current) {
      console.log('[AuthInitializer] Обнаружен токен, загружаем данные пользователя');
      
      // Устанавливаем флаг, что попытка инициализации была произведена
      initializeAttempted.current = true;
      
      dispatch(getUserProfile() as any)
        .then((action: any) => {
          console.log('[AuthInitializer] Результат загрузки:', 
            action.type === getUserProfile.fulfilled.type ? 'успешно' : 'ошибка',
            action.payload);
        })
        .catch((error: any) => {
          console.error('[AuthInitializer] Ошибка при загрузке данных пользователя:', error);
        });
    }
  }, [dispatch, token, isAuthenticated, loading, user]);

  return null; // Компонент не рендерит ничего видимого
};

export default AuthInitializer; 