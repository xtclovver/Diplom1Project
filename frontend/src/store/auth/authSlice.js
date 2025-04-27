import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/api';

// Асинхронные действия
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response.data;
    } catch (error) {
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
      const response = await authService.getUserProfile();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось получить профиль');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.updateUserProfile(userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось обновить профиль');
    }
  }
);

export const checkAdminAccess = createAsyncThunk(
  'auth/checkAdminAccess',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.checkAdminAccess();
      return response.data;
    } catch (error) {
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
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAdmin = action.payload.user.role === 'admin';
        localStorage.setItem('token', action.payload.token);
      })
      .addCase(login.rejected, (state, action) => {
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
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAdmin = action.payload.role === 'admin';
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Обработчики для updateUserProfile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
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