import api from './api';

// Сервис для работы с пользователями
const userService = {
  // Получение текущего пользователя
  getCurrentUser: async () => {
    console.log('[User Service] Запрос данных текущего пользователя');
    try {
      const response = await api.get('/users/me');
      console.log('[User Service] Получены данные пользователя:', response.data);
      return response;
    } catch (error) {
      console.error('[User Service] Ошибка получения данных пользователя:', error);
      throw error;
    }
  },
  
  // Обновление профиля пользователя
  updateUserProfile: async (userData) => {
    console.log('[User Service] Обновление профиля пользователя:', userData);
    
    // Преобразуем данные для API
    const backendData = {
      first_name: userData.firstName,
      last_name: userData.lastName,
      email: userData.email,
      phone: userData.phone,
      birth_date: userData.birthDate
    };
    
    console.log('[User Service] Данные для отправки на сервер:', backendData);
    return api.put('/users/me', backendData);
  },
  
  // Изменение пароля
  changePassword: async (oldPassword, newPassword) => {
    console.log('[User Service] Запрос на изменение пароля');
    return api.put('/users/me/password', {
      old_password: oldPassword,
      new_password: newPassword
    });
  }
};

export default userService; 