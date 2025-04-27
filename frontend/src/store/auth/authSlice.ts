import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { authService } from '../../services/api';

// Типы данных
interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  role: {
    id: number;
    name: string;
  };
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  token: string | null;
  loading: boolean;
  error: string | null;
}

// Начальное состояние
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  token: localStorage.getItem('token'),
  loading: false,
  error: null
};

// API mock (в реальном приложении здесь будут реальные запросы к API)
const mockLogin = (credentials: { username: string; password: string }): Promise<{ user: User; token: string }> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Имитация авторизации
      if (credentials.username === 'admin' && credentials.password === 'admin') {
        resolve({
          user: {
            id: 1,
            username: 'admin',
            email: 'admin@example.com',
            fullName: 'Администратор',
            phone: '+7 (999) 123-45-67',
            role: {
              id: 1,
              name: 'admin'
            }
          },
          token: 'admin-mock-token'
        });
      } else if (credentials.username === 'user' && credentials.password === 'user') {
        resolve({
          user: {
            id: 2,
            username: 'user',
            email: 'user@example.com',
            fullName: 'Пользователь Тестовый',
            phone: '+7 (999) 987-65-43',
            role: {
              id: 2,
              name: 'user'
            }
          },
          token: 'user-mock-token'
        });
      } else {
        reject(new Error('Неверное имя пользователя или пароль'));
      }
    }, 800);
  });
};

// Используем реальный API вместо заглушки
// Функция register использует API из сервиса authService

const mockGetUserProfile = (): Promise<User> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: 2,
        username: 'user',
        email: 'user@example.com',
        fullName: 'Пользователь Тестовый',
        phone: '+7 (999) 987-65-43',
        role: {
          id: 2,
          name: 'user'
        }
      });
    }, 500);
  });
};

const mockUpdateUserProfile = (profileData: UserProfile): Promise<User> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: 2,
        username: 'user',
        email: profileData.email,
        fullName: `${profileData.firstName} ${profileData.lastName}`,
        phone: profileData.phone,
        role: {
          id: 2,
          name: 'user'
        }
      });
    }, 500);
  });
};

// Асинхронные action creators
export const login = createAsyncThunk<
  { accessToken: string; refreshToken: string },
  { usernameOrEmail: string; password: string }
>(
  'auth/login',
  async (credentials, { rejectWithValue, dispatch }) => {
    try {
      // Выполняем реальный запрос к API
      const response = await authService.login({
        usernameOrEmail: credentials.usernameOrEmail,
        password: credentials.password
      });
      
      // Проверяем структуру ответа и извлекаем токены
      const data = response.data;
      const accessToken = data.accessToken || data.token;
      const refreshToken = data.refreshToken || data.refresh_token;
      
      if (!accessToken) {
        return rejectWithValue('Не получен токен доступа от сервера');
      }
      
      // Сохраняем токены в localStorage
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      localStorage.setItem('token', accessToken); // Для совместимости
      
      // Запрашиваем данные пользователя
      dispatch(getUserProfile());
      
      return { 
        accessToken, 
        refreshToken: refreshToken || '' 
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return rejectWithValue(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Не удалось авторизоваться'
      );
    }
  }
);

export const register = createAsyncThunk<
  { user: User; token: string },
  {
    username: string;
    email: string;
    password: string;
    fullName: string;
    phone: string;
  }
>(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      // Преобразуем данные в формат, ожидаемый API
      const apiUserData = {
        email: userData.email,
        password: userData.password,
        name: userData.fullName // используем fullName как name
      };
      
      // Вызываем API
      const response = await authService.register(apiUserData);
      
      // Преобразуем ответ API в ожидаемый формат
      const token = response.data.accessToken || response.data.token;
      
      // Сохраняем токен в localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('accessToken', token);
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
      
      // Возвращаем данные в формате, ожидаемом reducer'ом
      return {
        user: response.data.user,
        token: token
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Не удалось зарегистрироваться'
      );
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    // Удаляем токен из localStorage
    localStorage.removeItem('token');
    return null;
  }
);

export const checkAdminAccess = createAsyncThunk<
  boolean,
  void
>(
  'auth/checkAdminAccess',
  async (_, { getState, rejectWithValue }) => {
    const state: any = getState();
    const { user } = state.auth;
    
    if (!user) {
      return rejectWithValue('Пользователь не авторизован');
    }
    
    // В реальном приложении здесь был бы запрос к API для проверки прав
    return user.role.name === 'admin';
  }
);

export const getUserProfile = createAsyncThunk<
  User,
  void
>(
  'auth/getUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      // Запрос данных пользователя через API
      const response = await authService.getCurrentUser();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Не удалось получить данные пользователя');
    }
  }
);

export const updateUserProfile = createAsyncThunk<
  User,
  UserProfile
>(
  'auth/updateUserProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      // В реальном приложении здесь будет запрос к API
      const response = await mockUpdateUserProfile(profileData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Не удалось обновить профиль пользователя');
    }
  }
);

// Создание slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Обработка login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
        state.loading = false;
        state.token = action.payload.accessToken;
        state.isAuthenticated = true;
        // Теперь данные пользователя будут установлены через getUserProfile
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      
      // Обработка register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<{ user: User; token: string }>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.isAdmin = action.payload.user.role.name === 'admin';
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Обработка logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isAdmin = false;
      })
      
      // Обработка checkAdminAccess
      .addCase(checkAdminAccess.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAdminAccess.fulfilled, (state, action: PayloadAction<boolean>) => {
        state.loading = false;
        state.isAdmin = action.payload;
      })
      .addCase(checkAdminAccess.rejected, (state) => {
        state.loading = false;
        state.isAdmin = false;
      })
      
      // Обработка getUserProfile
      .addCase(getUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserProfile.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload;
        state.isAdmin = action.payload.role.name === 'admin';
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Обработка updateUserProfile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer; 