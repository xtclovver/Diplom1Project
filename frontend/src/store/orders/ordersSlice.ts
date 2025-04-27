import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { orderService } from '../../services/api';

// Типы данных
interface Order {
  id: number;
  userId: number;
  tourId: number;
  tourDateId: number;
  roomId: number | null;
  peopleCount: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled' | 'completed';
  createdAt: string;
  tour: {
    id: number;
    name: string;
    imageUrl: string;
  };
  tourDate: {
    startDate: string;
    endDate: string;
  };
  room?: {
    id: number;
    description: string;
    beds: number;
  };
}

interface BookingData {
  tourId: string;
  tourDateId: number;
  roomId: number | null;
  peopleCount: number;
  totalPrice: number;
}

interface OrdersState {
  orders: Order[];
  bookingData: BookingData;
  loading: boolean;
  error: string | null;
}

// Начальное состояние
const initialState: OrdersState = {
  orders: [],
  bookingData: {
    tourId: '',
    tourDateId: 0,
    roomId: null,
    peopleCount: 1,
    totalPrice: 0
  },
  loading: false,
  error: null
};

// Асинхронные action creators
export const fetchUserOrders = createAsyncThunk<
  Order[],
  void
>(
  'orders/fetchUserOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await orderService.getUserOrders();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось загрузить заказы');
    }
  }
);

export const createOrder = createAsyncThunk<
  Order,
  void
>(
  'orders/createOrder',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state: any = getState();
      const { bookingData } = state.orders;
      
      // Проверка данных бронирования
      if (!bookingData.tourId || !bookingData.tourDateId || bookingData.peopleCount < 1) {
        return rejectWithValue('Не все данные для бронирования заполнены');
      }
      
      const response = await orderService.createOrder(bookingData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось создать заказ');
    }
  }
);

export const cancelOrder = createAsyncThunk<
  number,
  number
>(
  'orders/cancelOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      await orderService.cancelOrder(orderId.toString());
      return orderId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось отменить заказ');
    }
  }
);

// Создание slice
const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setBookingData: (state, action: PayloadAction<Partial<BookingData>>) => {
      state.bookingData = { ...state.bookingData, ...action.payload };
    },
    clearBookingData: (state) => {
      state.bookingData = initialState.bookingData;
    }
  },
  extraReducers: (builder) => {
    builder
      // Обработка fetchUserOrders
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action: PayloadAction<Order[]>) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Обработка createOrder
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action: PayloadAction<Order>) => {
        state.loading = false;
        state.orders.push(action.payload);
        state.bookingData = initialState.bookingData; // Очищаем данные бронирования
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Обработка cancelOrder
      .addCase(cancelOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        // Обновляем статус заказа на 'cancelled'
        const order = state.orders.find(order => order.id === action.payload);
        if (order) {
          order.status = 'cancelled';
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
  }
});

export const { setBookingData, clearBookingData } = ordersSlice.actions;

export default ordersSlice.reducer; 