import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth/authSlice';
import tourReducer from './tour/tourSlice';
import toursReducer from './tours/toursSlice';
import ordersReducer from './orders/ordersSlice';
import supportReducer from './support/supportSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    tour: tourReducer,
    tours: toursReducer,
    orders: ordersReducer,
    support: supportReducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store; 