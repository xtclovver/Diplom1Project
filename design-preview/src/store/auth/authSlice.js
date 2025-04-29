import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login(state) {
      state.isAuthenticated = true;
      state.user = { name: 'Пользователь' };
    },
    logout(state) {
      state.isAuthenticated = false;
      state.user = null;
    }
  }
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;