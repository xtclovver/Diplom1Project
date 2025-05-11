import { configureStore } from '@reduxjs/toolkit';
import toursReducer from './tours/toursSlice';
import ordersReducer from './orders/ordersSlice';
import authReducer from './auth/authSlice';
import supportReducer from './support/supportSlice';
import adminToursReducer from './admin/adminToursSlice';

const store = configureStore({
  reducer: {
    tours: toursReducer,
    orders: ordersReducer,
    auth: authReducer,
    support: supportReducer,
    adminTours: adminToursReducer
  },
  // Отключаем middleware SerializableStateInvariantMiddleware в development
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store; 