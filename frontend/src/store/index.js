import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth/authSlice';
import tourReducer from './tour/tourSlice';
import orderReducer from './order/orderSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    tour: tourReducer,
    order: orderReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

export default store;