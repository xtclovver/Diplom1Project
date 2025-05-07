import axios from 'axios';

// Импортируем унифицированный интерфейс фильтров
import { TourFilters } from '../components/tour/TourFilter'; // Убедитесь, что путь к TourFilter.tsx корректен

// Используем переменную окружения или значение по умолчанию
const API_URL = process.env.REACT_APP_API_URL || '/api';

// Создаем экземпляр axios с базовым URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false // Отключаем credentials для избежания проблем с CORS
});

// Интерцептор для добавления токена авторизации
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ответов
api.interceptors.response.use(
  (response) => {
    console.log('[API Response]', response.config.url, response.status);
    return response;
  },
  async (error) => {
    console.error('[API Error]', error.config?.url, error.response?.status, error.response?.data);
    const originalRequest = error.config;
    
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      console.log('[Auth] Попытка обновить токен после 401 ошибки');
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        console.log('[Auth] Refresh token из localStorage:', refreshToken ? 'получен' : 'отсутствует');
        
        if (refreshToken) {
          console.log('[Auth] Отправляем запрос на обновление токена');
          const res = await axios.post(`${API_URL}/auth/refresh`, JSON.stringify({ refreshToken }), {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          console.log('[Auth] Ответ обновления токена:', res.status, res.data);
          
          if (res.data.accessToken && res.data.refreshToken) {
            console.log('[Auth] Сохраняем новые токены');
            localStorage.setItem('accessToken', res.data.accessToken);
            localStorage.setItem('refreshToken', res.data.refreshToken);
            localStorage.setItem('token', res.data.accessToken); // Для совместимости
            
            console.log('[Auth] Повторный запрос с новым токеном');
            originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
            return api(originalRequest);
          } else {
            console.error('[Auth] Ответ не содержит нужных токенов:', res.data);
          }
        }
      } catch (err) {
        if (axios.isAxiosError(err)) {
          console.error('[Auth] Ошибка обновления токена:', err.response?.status, err.response?.data);
        } else {
          console.error('[Auth] Ошибка обновления токена:', err);
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('token');
      }
    }
    
    return Promise.reject(error);
  }
);

// Сервис для работы с турами
export const tourService = {
  getTours: (filters: TourFilters, page: number, size: number) => {
    const params: Record<string, any> = { page, size };
    for (const key in filters) {
      if (Object.prototype.hasOwnProperty.call(filters, key)) {
        const value = filters[key as keyof TourFilters];
        if (value !== undefined && value !== '') {
          if (key === 'dateFrom') {
            params['startDateAfter'] = value;
          } else if (key === 'dateTo') {
            params['startDateBefore'] = value;
          } else {
             params[key] = value;
          }
        }
      }
    }
    console.log('[API Request Params] /tours:', params);
    return api.get('/tours', { params });
  },
  getTourById: (id: string) => {
    return api.get(`/tours/${id}`);
  },
  getTourDates: (tourId: string) => {
    return api.get(`/tours/${tourId}/dates`);
  }
};

// Сервис для работы с отелями
export const hotelService = {
  getHotels: (filters = {}, page = 1, size = 10) => {
    return api.get('/hotels', { params: { ...filters, page, size } });
  },
  getHotelById: (id: string) => {
    return api.get(`/hotels/${id}`);
  },
  getHotelRooms: (hotelId: number) => {
    return api.get(`/hotels/${hotelId}/rooms`);
  },
  // Добавлено из api.js
  getRoomById: (id: string | number) => { // Уточнил тип id
    return api.get(`/rooms/${id}`);
  },
  getRoomAvailability: (roomId: string, startDate: string, endDate: string) => {
    return api.get(`/hotels/rooms/${roomId}/availability`, {
      params: { startDate, endDate }
    });
  }
};

// Сервис для работы с аутентификацией
export const authService = {
  login: (credentials: { usernameOrEmail: string; password: string }) => {
    return api.post('/auth/login', credentials)
      .catch(error => {
        console.error('[Auth API] Ошибка при попытке входа:', error.response?.status, error.response?.data);
        if (error.response?.status === 401) {
          const errorMsg = error.response.data?.error || '';
          if (errorMsg.includes('invalid credentials')) {
            console.error('[Auth API] Неверные учетные данные');
            error.response.data.error = 'Неверное имя пользователя или пароль';
          }
        }
        throw error;
      });
  },
  register: (userData: { email: string; password: string; name: string }) => {
    return api.post('/auth/register', userData);
  },
  refreshToken: (refreshToken: string) => {
    console.log('[Auth API] Отправка запроса на обновление токена', {refreshToken: refreshToken ? 'Токен есть' : 'Токен отсутствует'});
    return axios.post(`${API_URL}/auth/refresh`, { refreshToken });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
  getCurrentUser: async () => {
    console.log('[Auth API] Запрос данных текущего пользователя');
    try {
      const response = await api.get('/auth/me'); // Используем /auth/me как в оригинальном api.ts
      console.log('[Auth API] Ответ от сервера:', response.status);
      console.log('[Auth API] Данные пользователя:', JSON.stringify(response.data, null, 2));
      if (!response.data || typeof response.data !== 'object') {
        console.error('[Auth API] Некорректный формат данных пользователя:', response.data);
        throw new Error('Некорректный формат данных пользователя');
      }
      if (!response.data.role) {
        console.error('[Auth API] Отсутствует поле role в данных пользователя');
        response.data.role = { id: 0, name: 'user' };
      }
      return response;
    } catch (error) {
      console.error('[Auth API] Ошибка получения данных пользователя:', error);
      throw error;
    }
  },
  updateUserProfile: (profileData: { 
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthDate: string; 
  }) => {
    console.log('[Auth API] Отправка запроса на обновление профиля:', profileData);
    const backendData = {
      first_name: profileData.firstName,
      last_name: profileData.lastName, 
      email: profileData.email,
      phone: profileData.phone,
      birth_date: profileData.birthDate
    };
    console.log('[Auth API] Преобразованные данные для бэкенда:', backendData);
    return api.put('/users/me', backendData); // Эндпоинт /users/me
  }
};

// Сервис для работы с заказами
export const orderService = {
  createOrder: (orderData: any) => {
    console.log('API: Отправка запроса на создание заказа', orderData); // Лог из api.js
    return api.post('/orders', orderData)
      .then(response => { // then/catch из api.js
        console.log('API: Успешный ответ при создании заказа', response.data);
        return response;
      })
      .catch(error => {
        console.error('API: Ошибка при создании заказа', error.response?.data || error.message);
        throw error;
      });
  },
  getUserOrders: () => {
    return api.get('/orders');
  },
  getOrderById: (id: string) => {
    return api.get(`/orders/${id}`);
  },
  cancelOrder: (id: string) => {
    return api.delete(`/orders/${id}`);
  }
};

// Сервис для работы с тикетами тех-поддержки
export const supportService = {
  createTicket: (ticketData: { subject: string; message: string }) => {
    return api.post('/tickets', ticketData);
  },
  getUserTickets: () => {
    return api.get('/tickets');
  },
  getTicketById: (id: number) => {
    return api.get(`/tickets/${id}`);
  },
  addTicketMessage: (id: number, message: string) => {
    return api.post(`/tickets/${id}/messages`, { message });
  },
  getTicketMessages: (id: number) => {
    return api.get(`/tickets/${id}/messages`);
  },
  closeTicket: (id: number) => {
    return api.put(`/tickets/${id}/close`);
  }
};

// Сервис для работы с пользователями (добавлен из api.js)
// Обратите внимание: getCurrentUser дублируется с authService.getCurrentUser.
// Рекомендуется выбрать один или убедиться, что они служат разным целям.
export const userService = {
  getCurrentUser: () => { // Этот метод дублирует authService.getCurrentUser
    return api.get('/users/me'); // Эндпоинт из api.js
  },
  updateUser: (userData: any) => { // Типизируйте userData при необходимости
    return api.put('/users/me', userData);
  },
  changePassword: (passwordData: any) => { // Типизируйте passwordData
    return api.put('/users/me/password', passwordData);
  }
};

// Админ-сервис (добавлен из api.js)
export const adminService = {
  // Пользователи
  getAllUsers: (page = 1, size = 10) => {
    return api.get('/admin/users', { params: { page, size } });
  },
  getUserById: (id: string | number) => { // Уточнил тип id
    return api.get(`/admin/users/${id}`);
  },
  updateUser: (id: string | number, userData: any) => { // Типизируйте userData
    return api.put(`/admin/users/${id}`, userData);
  },
  deleteUser: (id: string | number) => {
    return api.delete(`/admin/users/${id}`);
  },
  // Туры
  createTour: (tourData: any) => { // Типизируйте tourData
    return api.post('/admin/tours', tourData);
  },
  updateTour: (id: string | number, tourData: any) => { // Типизируйте tourData
    return api.put(`/admin/tours/${id}`, tourData);
  },
  deleteTour: (id: string | number) => {
    return api.delete(`/admin/tours/${id}`);
  },
  // Отели
  createHotel: (hotelData: any) => { // Типизируйте hotelData
    return api.post('/admin/hotels', hotelData);
  },
  updateHotel: (id: string | number, hotelData: any) => { // Типизируйте hotelData
    return api.put(`/admin/hotels/${id}`, hotelData);
  },
  deleteHotel: (id: string | number) => {
    return api.delete(`/admin/hotels/${id}`);
  },
  // Заказы
  getAllOrders: (filters = {}, page = 1, size = 10) => {
    return api.get('/admin/orders', { params: { ...filters, page, size } });
  },
  updateOrderStatus: (id: string | number, status: string) => { // Типизируйте status
    return api.put(`/admin/orders/${id}/status`, { status });
  }
};

export default api;