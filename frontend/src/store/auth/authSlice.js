import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/api';
import userService from '../../services/userService';

// Асинхронные действия
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue, dispatch }) => {
    try {
      console.log('[Auth JS] Отправка запроса на аутентификацию');
      const response = await authService.login(credentials);
      console.log('[Auth JS] Успешный ответ от сервера:', response.status);
      console.log('[Auth JS] Данные ответа:', JSON.stringify(response.data, null, 2));
      
      // Проверяем структуру ответа и извлекаем токены
      const accessToken = response.data.accessToken;
      const refreshToken = response.data.refreshToken;
      
      if (!accessToken || !refreshToken) {
        console.error('[Auth JS] Отсутствуют токены в ответе');
        return rejectWithValue('Не получены токены доступа от сервера');
      }
      
      // Сохраняем токены в localStorage
      console.log('[Auth JS] Сохранение токенов в localStorage');
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('token', accessToken); // Для совместимости
      
      // Запрашиваем данные пользователя
      console.log('[Auth JS] Запрос данных пользователя');
      dispatch(getUserProfile());
      
      return { 
        accessToken, 
        refreshToken 
      };
    } catch (error) {
      console.error('[Auth JS] Ошибка входа:', error);
      return rejectWithValue(error.response?.data?.message || 'Не удалось войти');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось зарегистрироваться');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при выходе');
    }
  }
);

export const getUserProfile = createAsyncThunk(
  'auth/getUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      console.log('[Auth JS] Начало запроса данных пользователя');
      // Используем userService вместо authService
      const response = await userService.getCurrentUser();
      console.log('[Auth JS] Получен ответ от сервера с данными пользователя');
      
      if (!response.data) {
        console.error('[Auth JS] Ответ не содержит данных пользователя');
        return rejectWithValue('Ответ сервера не содержит данных пользователя');
      }
      
      console.log('[Auth JS] Данные пользователя:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('[Auth JS] Ошибка при получении данных пользователя:', error);
      return rejectWithValue(error.response?.data?.message || 'Не удалось получить профиль');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (userData, { rejectWithValue }) => {
    try {
      console.log('[Auth JS] Обновление профиля пользователя:', userData);
      
      // Используем userService вместо authService
      const response = await userService.updateUserProfile(userData);
      console.log('[Auth JS] Ответ на обновление профиля:', response.status, response.data);
      
      // После успешного обновления получаем актуальные данные
      const userResponse = await userService.getCurrentUser();
      console.log('[Auth JS] Получены обновленные данные пользователя:', userResponse.data);
      
      return userResponse.data;
    } catch (error) {
      console.error('[Auth JS] Ошибка при обновлении профиля:', error);
      return rejectWithValue(error.response?.data?.message || 'Не удалось обновить профиль');
    }
  }
);

export const checkAdminAccess = createAsyncThunk(
  'auth/checkAdminAccess',
  async (_, { rejectWithValue, getState }) => {
    try {
      console.log('[Auth JS] Проверка прав администратора');
      
      // Получаем текущего пользователя из состояния
      const state = getState();
      const { user } = state.auth;
      
      if (!user) {
        console.error('[Auth JS] Нет данных пользователя для проверки прав администратора');
        return rejectWithValue('Пользователь не авторизован');
      }
      
      // Проверяем роль пользователя
      const isAdmin = user.role && user.role.name === 'admin';
      console.log('[Auth JS] Результат проверки прав администратора:', isAdmin);
      
      return { isAdmin };
    } catch (error) {
      console.error('[Auth JS] Ошибка при проверке прав администратора:', error);
      return rejectWithValue(error.response?.data?.message || 'Нет доступа к администрированию');
    }
  }
);

// Начальное состояние
const initialState = {
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isAdmin: false,
  loading: false,
  error: null
};

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setToken: (state, action) => {
      state.token = action.payload;
      state.isAuthenticated = !!action.payload;
      if (action.payload) {
        localStorage.setItem('token', action.payload);
      } else {
        localStorage.removeItem('token');
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Обработчики для login
      .addCase(login.pending, (state) => {
        console.log('[Auth JS Reducer] login.pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        console.log('[Auth JS Reducer] login.fulfilled, данные:', JSON.stringify(action.payload, null, 2));
        state.loading = false;
        // Токены уже установлены в localStorage внутри thunk
        state.token = action.payload.accessToken;
        // НЕ устанавливаем user и isAuthenticated здесь
        // Это будет сделано в getUserProfile.fulfilled
      })
      .addCase(login.rejected, (state, action) => {
        console.error('[Auth JS Reducer] login.rejected:', action.payload);
        state.loading = false;
        state.error = action.payload;
      })
      
      // Обработчики для register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Обработчики для logout
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.isAdmin = false;
        localStorage.removeItem('token');
      })
      .addCase(logout.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.isAdmin = false;
        localStorage.removeItem('token');
      })
      
      // Обработчики для getUserProfile
      .addCase(getUserProfile.pending, (state) => {
        console.log('[Auth JS Reducer] getUserProfile.pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        console.log('[Auth JS Reducer] getUserProfile.fulfilled, данные:', JSON.stringify(action.payload, null, 2));
        state.loading = false;
        // Проверка данных пользователя
        if (!action.payload) {
          console.error('[Auth JS Reducer] getUserProfile.fulfilled получил пустые данные');
          state.error = 'Получены пустые данные пользователя';
          return;
        }
        
        // Проверка наличия роли
        if (!action.payload.role) {
          console.error('[Auth JS Reducer] Отсутствует роль в данных пользователя');
          action.payload.role = { id: 0, name: 'user' }; // Устанавливаем роль по умолчанию
        }
        
        state.user = action.payload;
        state.isAuthenticated = true; // Устанавливаем здесь после получения данных пользователя
        state.isAdmin = action.payload.role && action.payload.role.name === 'admin';
        
        console.log('[Auth JS Reducer] Состояние после getUserProfile.fulfilled:', {
          isAuthenticated: state.isAuthenticated,
          isAdmin: state.isAdmin,
          hasUser: !!state.user
        });
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        console.error('[Auth JS Reducer] getUserProfile.rejected:', action.payload);
        state.loading = false;
        state.error = action.payload;
      })
      
      // Обработчики для updateUserProfile
      .addCase(updateUserProfile.pending, (state) => {
        console.log('[Auth JS Reducer] updateUserProfile.pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        console.log('[Auth JS Reducer] updateUserProfile.fulfilled, данные:', JSON.stringify(action.payload, null, 2));
        state.loading = false;
        
        // Проверка данных пользователя
        if (!action.payload) {
          console.error('[Auth JS Reducer] updateUserProfile.fulfilled получил пустые данные');
          state.error = 'Получены пустые данные пользователя';
          return;
        }
        
        // Проверка наличия роли
        if (!action.payload.role) {
          console.error('[Auth JS Reducer] Отсутствует роль в обновленных данных пользователя');
          action.payload.role = { id: 0, name: 'user' }; // Устанавливаем роль по умолчанию
        }
        
        // Формируем fullName из first_name и last_name, если fullName не присутствует
        if (!action.payload.fullName && (action.payload.first_name || action.payload.firstName)) {
          const firstName = action.payload.first_name || action.payload.firstName || '';
          const lastName = action.payload.last_name || action.payload.lastName || '';
          action.payload.fullName = `${firstName} ${lastName}`.trim();
          console.log('[Auth JS Reducer] Сформировано fullName:', action.payload.fullName);
        }
        
        state.user = action.payload;
        console.log('[Auth JS Reducer] Состояние после updateUserProfile.fulfilled:', {
          hasUser: !!state.user,
          fullName: state.user.fullName,
          firstName: state.user.first_name || state.user.firstName,
          lastName: state.user.last_name || state.user.lastName
        });
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        console.error('[Auth JS Reducer] updateUserProfile.rejected:', action.payload);
        state.loading = false;
        state.error = action.payload;
      })
      
      // Обработчики для checkAdminAccess
      .addCase(checkAdminAccess.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAdminAccess.fulfilled, (state, action) => {
        state.loading = false;
        state.isAdmin = action.payload.isAdmin;
      })
      .addCase(checkAdminAccess.rejected, (state) => {
        state.loading = false;
        state.isAdmin = false;
      });
  }
});

export const { clearError, setToken } = authSlice.actions;

export default authSlice.reducer; 