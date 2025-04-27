import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

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
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
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
  // Получение номеров отеля
  getRooms: (hotelId: string) => {
    return api.get(`/hotels/${hotelId}/rooms`);
  },
  
  // Алиас для совместимости с существующими компонентами
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
  },
  
  // Получение информации об отеле
  getHotelById: (id: string) => {
    return api.get(`/hotels/${id}`);
  }
};

// Сервис для работы с аутентификацией
export const authService = {
  login: (credentials: { email: string; password: string }) => {
    return api.post('/auth/login', credentials);
  },

  register: (userData: { email: string; password: string; name: string }) => {
    return api.post('/auth/register', userData);
  },

  logout: () => {
    localStorage.removeItem('token');
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
  }
};

export default api; 