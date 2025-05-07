import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';

// Создаем экземпляр axios с базовым URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
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
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Если ошибка 401 (Unauthorized) и запрос еще не повторялся
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Пытаемся обновить токен
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          
          // Если получили новые токены, сохраняем их
          if (res.data.accessToken && res.data.refreshToken) {
            localStorage.setItem('accessToken', res.data.accessToken);
            localStorage.setItem('refreshToken', res.data.refreshToken);
            localStorage.setItem('token', res.data.accessToken); // Для совместимости
            
            // Повторяем исходный запрос с новым токеном
            originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
            return api(originalRequest);
          }
        }
      } catch (err) {
        // Если не удалось обновить токен, выходим из системы
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('token');
        
        // Перенаправляем на страницу входа если мы не на странице логина
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Сервис для работы с турами
export const tourService = {
  // Получение списка туров с фильтрацией и пагинацией
  getTours: (filters: any, page: number, size: number) => {
    return api.get('/tours', {
      params: {
        ...filters,
        page,
        size
      }
    });
  },

  // Получение информации о конкретном туре
  getTourById: (id: string) => {
    return api.get(`/tours/${id}`);
  },

  // Получение доступных дат для тура
  getTourDates: (tourId: string) => {
    return api.get(`/tours/${tourId}/dates`);
  }
};

// Сервис для работы с отелями
export const hotelService = {
  // Получение списка отелей с фильтрацией
  getHotels: (filters = {}, page = 1, size = 10) => {
    return api.get('/hotels', { params: { ...filters, page, size } });
  },

  // Получение информации об отеле
  getHotelById: (id: string) => {
    return api.get(`/hotels/${id}`);
  },
  
  // Получение номеров отеля
  getHotelRooms: (hotelId: number) => {
    return api.get(`/hotels/${hotelId}/rooms`);
  },
  
  // Получение доступности номеров
  getRoomAvailability: (roomId: string, startDate: string, endDate: string) => {
    return api.get(`/hotels/rooms/${roomId}/availability`, {
      params: {
        startDate,
        endDate
      }
    });
  }
};

// Сервис для работы с аутентификацией
export const authService = {
  login: (credentials: { usernameOrEmail: string; password: string }) => {
    return api.post('/auth/login', credentials);
  },

  register: (userData: { email: string; password: string; name: string }) => {
    return api.post('/auth/register', userData);
  },
  
  // Обновление токена
  refreshToken: (refreshToken: string) => {
    return api.post('/auth/refresh', { refreshToken });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  getCurrentUser: () => {
    return api.get('/auth/me');
  }
};

// Сервис для работы с заказами
export const orderService = {
  createOrder: (orderData: any) => {
    return api.post('/orders', orderData);
  },

  getUserOrders: () => {
    return api.get('/orders');
  },

  getOrderById: (id: string) => {
    return api.get(`/orders/${id}`);
  },
  
  // Отмена заказа
  cancelOrder: (id: string) => {
    return api.delete(`/orders/${id}`);
  }
};

// Сервис для работы с тикетами тех-поддержки
export const supportService = {
  // Создание тикета
  createTicket: (ticketData: { subject: string; message: string }) => {
    return api.post('/tickets', ticketData);
  },
  
  // Получение списка тикетов пользователя
  getUserTickets: () => {
    return api.get('/tickets');
  },
  
  // Получение тикета по ID
  getTicketById: (id: number) => {
    return api.get(`/tickets/${id}`);
  },
  
  // Добавление сообщения в тикет
  addTicketMessage: (id: number, message: string) => {
    return api.post(`/tickets/${id}/messages`, { message });
  },
  
  // Получение сообщений тикета
  getTicketMessages: (id: number) => {
    return api.get(`/tickets/${id}/messages`);
  },
  
  // Закрытие тикета
  closeTicket: (id: number) => {
    return api.put(`/tickets/${id}/close`);
  }
};

export default api; 