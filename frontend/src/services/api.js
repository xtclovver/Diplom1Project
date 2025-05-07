import axios from 'axios';

// Базовый URL API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

// Создаем экземпляр axios с базовым URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Добавляем перехватчик для добавления токена авторизации к запросам
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Добавляем перехватчик для обработки ошибок
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Если ошибка 401 (Unauthorized) и запрос еще не повторялся
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Пытаемся обновить токен
        const refreshToken = localStorage.getItem('refreshToken');
        const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        
        // Если получили новые токены, сохраняем их
        if (res.data.accessToken && res.data.refreshToken) {
          localStorage.setItem('accessToken', res.data.accessToken);
          localStorage.setItem('refreshToken', res.data.refreshToken);
          
          // Повторяем исходный запрос с новым токеном
          originalRequest.headers['Authorization'] = `Bearer ${res.data.accessToken}`;
          return api(originalRequest);
        }
      } catch (err) {
        // Если не удалось обновить токен, выходим из системы
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Перенаправляем на страницу входа
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }
    
    return Promise.reject(error);
  }
);

// Сервисы для работы с API

// Аутентификация
export const authService = {
  // Регистрация пользователя
  register: (userData) => {
    return api.post('/auth/register', userData);
  },
  
  // Вход пользователя
  login: (credentials) => {
    return api.post('/auth/login', credentials);
  },
  
  // Обновление токена
  refreshToken: (refreshToken) => {
    return api.post('/auth/refresh', { refreshToken });
  },
  
  // Получение данных текущего пользователя
  getCurrentUser: () => {
    return api.get('/users/me');
  }
};

// Пользователи
export const userService = {
  // Получение текущего пользователя
  getCurrentUser: () => {
    return api.get('/users/me');
  },
  
  // Обновление данных пользователя
  updateUser: (userData) => {
    return api.put('/users/me', userData);
  },
  
  // Изменение пароля
  changePassword: (passwordData) => {
    return api.put('/users/me/password', passwordData);
  }
};

// Туры
export const tourService = {
  // Получение списка туров с фильтрацией
  getTours: (filters = {}, page = 1, size = 10) => {
    return api.get('/tours', { params: { ...filters, page, size } });
  },
  
  // Получение тура по ID
  getTourById: (id) => {
    return api.get(`/tours/${id}`);
  },
  
  // Получение дат тура
  getTourDates: (id) => {
    return api.get(`/tours/${id}/dates`);
  }
};

// Отели
export const hotelService = {
  // Получение списка отелей с фильтрацией
  getHotels: (filters = {}, page = 1, size = 10) => {
    return api.get('/hotels', { params: { ...filters, page, size } });
  },
  
  // Получение отеля по ID
  getHotelById: (id) => {
    return api.get(`/hotels/${id}`);
  },
  
  // Получение номеров отеля
  getHotelRooms: (id) => {
    return api.get(`/hotels/${id}/rooms`);
  },
  
  // Получение информации о конкретном номере по ID
  getRoomById: (id) => {
    return api.get(`/rooms/${id}`);
  },
  
  // Проверка доступности номера на указанные даты
  getRoomAvailability: (roomId, startDate, endDate) => {
    return api.get(`/rooms/${roomId}/availability`, { 
      params: { startDate, endDate } 
    });
  }
};

// Заказы
export const orderService = {
  // Создание заказа
  createOrder: (orderData) => {
    console.log('API: Отправка запроса на создание заказа', orderData);
    return api.post('/orders', orderData)
      .then(response => {
        console.log('API: Успешный ответ при создании заказа', response.data);
        return response;
      })
      .catch(error => {
        console.error('API: Ошибка при создании заказа', error.response?.data || error.message);
        throw error;
      });
  },
  
  // Получение списка заказов пользователя
  getUserOrders: () => {
    return api.get('/orders');
  },
  
  // Получение заказа по ID
  getOrderById: (id) => {
    return api.get(`/orders/${id}`);
  },
  
  // Отмена заказа
  cancelOrder: (id) => {
    return api.delete(`/orders/${id}`);
  }
};

// Тикеты тех-поддержки
export const supportService = {
  // Создание тикета
  createTicket: (ticketData) => {
    return api.post('/tickets', ticketData);
  },
  
  // Получение списка тикетов пользователя
  getUserTickets: () => {
    return api.get('/tickets');
  },
  
  // Получение тикета по ID
  getTicketById: (id) => {
    return api.get(`/tickets/${id}`);
  },
  
  // Добавление сообщения в тикет
  addTicketMessage: (id, message) => {
    return api.post(`/tickets/${id}/messages`, { message });
  },
  
  // Получение сообщений тикета
  getTicketMessages: (id) => {
    return api.get(`/tickets/${id}/messages`);
  },
  
  // Закрытие тикета
  closeTicket: (id) => {
    return api.put(`/tickets/${id}/close`);
  }
};

// Админ-панель
export const adminService = {
  // Пользователи
  getAllUsers: (page = 1, size = 10) => {
    return api.get('/admin/users', { params: { page, size } });
  },
  
  getUserById: (id) => {
    return api.get(`/admin/users/${id}`);
  },
  
  updateUser: (id, userData) => {
    return api.put(`/admin/users/${id}`, userData);
  },
  
  deleteUser: (id) => {
    return api.delete(`/admin/users/${id}`);
  },
  
  // Туры
  createTour: (tourData) => {
    return api.post('/admin/tours', tourData);
  },
  
  updateTour: (id, tourData) => {
    return api.put(`/admin/tours/${id}`, tourData);
  },
  
  deleteTour: (id) => {
    return api.delete(`/admin/tours/${id}`);
  },
  
  // Отели
  createHotel: (hotelData) => {
    return api.post('/admin/hotels', hotelData);
  },
  
  updateHotel: (id, hotelData) => {
    return api.put(`/admin/hotels/${id}`, hotelData);
  },
  
  deleteHotel: (id) => {
    return api.delete(`/admin/hotels/${id}`);
  },
  
  // Заказы
  getAllOrders: (filters = {}, page = 1, size = 10) => {
    return api.get('/admin/orders', { params: { ...filters, page, size } });
  },
  
  updateOrderStatus: (id, status) => {
    return api.put(`/admin/orders/${id}/status`, { status });
  }
};

export default api; 