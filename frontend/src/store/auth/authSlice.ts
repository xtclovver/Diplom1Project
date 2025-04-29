import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { authService } from '../../services/api';

// Типы данных
interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
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
    console.log('[Auth] Вызван метод login с:', credentials.usernameOrEmail);
    try {
      // Выполняем реальный запрос к API
      console.log('[Auth] Отправка запроса на аутентификацию');
      const response = await authService.login({
        usernameOrEmail: credentials.usernameOrEmail,
        password: credentials.password
      });
      
      console.log('[Auth] Успешный ответ от сервера:', response.status);
      
      // Проверяем структуру ответа и извлекаем токены
      const data = response.data;
      console.log('[Auth] Данные ответа:', JSON.stringify(data, null, 2));
      
      const accessToken = data.accessToken;
      const refreshToken = data.refreshToken;
      
      if (!accessToken || !refreshToken) {
        console.error('[Auth] Отсутствуют токены в ответе:', { accessToken: !!accessToken, refreshToken: !!refreshToken });
        return rejectWithValue('Не получены токены доступа от сервера');
      }
      
      // Сохраняем токены в localStorage
      console.log('[Auth] Сохранение токенов в localStorage');
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('token', accessToken); // Для совместимости
      
      // Запрашиваем данные пользователя и ждем выполнения
      console.log('[Auth] Запрос данных пользователя');
      try {
        const userResult = await dispatch(getUserProfile()).unwrap();
        console.log('[Auth] Успешно получены данные пользователя:', JSON.stringify(userResult, null, 2));
      } catch (userError) {
        console.error('[Auth] Ошибка при получении данных пользователя:', userError);
        // Продолжаем выполнение, поскольку аутентификация успешна, но логгируем ошибку
      }
      
      return { 
        accessToken, 
        refreshToken
      };
    } catch (error: any) {
      console.error('[Auth] Ошибка входа:', error);
      
      if (error.response) {
        console.error('[Auth] Детали ответа:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
        
        // Обработка разных статус-кодов с более информативными сообщениями
        if (error.response.status === 401) {
          const errorMessage = error.response.data?.error || 'Неверное имя пользователя или пароль';
          if (errorMessage.includes('invalid credentials')) {
            return rejectWithValue('Неверное имя пользователя или пароль');
          }
          return rejectWithValue(errorMessage);
        } else if (error.response.status === 400) {
          return rejectWithValue('Некорректные данные: ' + (error.response.data?.error || 'проверьте введенные данные'));
        } else if (error.response.status === 429) {
          return rejectWithValue('Слишком много попыток входа. Пожалуйста, подождите некоторое время');
        } else if (error.response.status >= 500) {
          return rejectWithValue('Ошибка сервера. Пожалуйста, попробуйте позже');
        }
      }
      
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
    // Удаляем все токены из localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
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
      console.log('[Auth] Начат запрос данных пользователя');
      // Запрос данных пользователя через API
      const response = await authService.getCurrentUser();
      console.log('[Auth] Получен ответ от сервера:', response.status);
      console.log('[Auth] Полученные данные пользователя:', JSON.stringify(response.data, null, 2));
      
      // Проверка корректности данных
      if (!response.data || !response.data.role) {
        console.error('[Auth] Некорректные данные пользователя:', response.data);
        return rejectWithValue('Получены некорректные данные пользователя');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('[Auth] Ошибка получения данных пользователя:', error);
      
      if (error.response) {
        console.error('[Auth] Детали ответа:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      
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
      // Используем реальный API вместо заглушки
      console.log('[Auth] Отправка запроса на обновление профиля:', profileData);
      const response = await authService.updateUserProfile(profileData);
      console.log('[Auth] Ответ на обновление профиля:', response.status, response.data);
      
      // После успешного обновления получаем актуальные данные пользователя
      const userResponse = await authService.getCurrentUser();
      console.log('[Auth] Получены обновленные данные пользователя:', userResponse.data);
      
      return userResponse.data;
    } catch (error: any) {
      console.error('[Auth] Ошибка обновления профиля:', error);
      console.error('[Auth] Детали ответа:', error.response?.status, error.response?.data);
      return rejectWithValue(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Не удалось обновить профиль пользователя'
      );
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
        console.log('[Auth Reducer] login.pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
        console.log('[Auth Reducer] login.fulfilled, accessToken получен:', !!action.payload.accessToken);
        state.loading = false;
        state.token = action.payload.accessToken;
        console.log('[Auth Reducer] Состояние после login.fulfilled:', { 
          hasToken: !!state.token,
          isAuthenticated: state.isAuthenticated
        });
        // Не устанавливаем isAuthenticated = true здесь, 
        // так как мы должны сначала получить данные пользователя
        // state.isAuthenticated = true;
        // Теперь данные пользователя будут установлены через getUserProfile
      })
      .addCase(login.rejected, (state, action) => {
        console.error('[Auth Reducer] login.rejected:', action.payload);
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        
        // Убеждаемся, что state обновлен до того, как произойдет перерисовка компонента
        state.user = null;
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
        console.log('[Auth Reducer] getUserProfile.pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserProfile.fulfilled, (state, action: PayloadAction<User>) => {
        console.log('[Auth Reducer] getUserProfile.fulfilled, данные:', JSON.stringify(action.payload, null, 2));
        state.loading = false;
        
        // Проверка наличия данных
        if (!action.payload) {
          console.error('[Auth Reducer] getUserProfile.fulfilled получил пустые данные');
          state.error = 'Получены пустые данные пользователя';
          return;
        }
        
        // Проверка роли
        if (!action.payload.role) {
          console.error('[Auth Reducer] getUserProfile.fulfilled: отсутствует роль в данных пользователя');
          action.payload.role = { id: 0, name: 'user' }; // Устанавливаем роль по умолчанию
        }
        
        // Формируем fullName из firstName и lastName, если оно не было получено с сервера
        if (!action.payload.fullName && action.payload.firstName) {
          action.payload.fullName = `${action.payload.firstName || ''} ${action.payload.lastName || ''}`.trim();
        }
        
        state.user = action.payload;
        // Устанавливаем isAuthenticated = true только после получения данных пользователя
        state.isAuthenticated = true;
        state.isAdmin = action.payload && action.payload.role && action.payload.role.name === 'admin';
        console.log('[Auth Reducer] Состояние после getUserProfile.fulfilled:', {
          isAuthenticated: state.isAuthenticated,
          isAdmin: state.isAdmin,
          hasUser: !!state.user
        });
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        console.error('[Auth Reducer] getUserProfile.rejected:', action.payload);
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Обработка updateUserProfile
      .addCase(updateUserProfile.pending, (state) => {
        console.log('[Auth Reducer] updateUserProfile.pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action: PayloadAction<User>) => {
        console.log('[Auth Reducer] updateUserProfile.fulfilled, данные:', action.payload);
        state.loading = false;
        
        // Сохраняем обновленные данные пользователя
        if (action.payload) {
          // Формируем fullName из firstName и lastName, если оно не было получено с сервера
          if (!action.payload.fullName && action.payload.firstName) {
            action.payload.fullName = `${action.payload.firstName || ''} ${action.payload.lastName || ''}`.trim();
          }
          
          state.user = action.payload;
          console.log('[Auth Reducer] Данные пользователя обновлены:', state.user);
        }
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        console.error('[Auth Reducer] updateUserProfile.rejected:', action.payload);
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer; 