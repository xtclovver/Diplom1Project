import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

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

// API mock (в реальном приложении здесь будут реальные запросы к API)
const mockFetchUserOrders = (): Promise<Order[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          userId: 2,
          tourId: 1,
          tourDateId: 1,
          roomId: 1,
          peopleCount: 2,
          totalPrice: 50000,
          status: 'confirmed',
          createdAt: '2023-05-10T12:30:00',
          tour: {
            id: 1,
            name: 'Тур в Сочи',
            imageUrl: '/img/tours/sochi.jpg'
          },
          tourDate: {
            startDate: '2023-06-01',
            endDate: '2023-06-08'
          },
          room: {
            id: 1,
            description: 'Стандартный двухместный номер',
            beds: 2
          }
        },
        {
          id: 2,
          userId: 2,
          tourId: 2,
          tourDateId: 3,
          roomId: null,
          peopleCount: 1,
          totalPrice: 30000,
          status: 'pending',
          createdAt: '2023-05-15T09:45:00',
          tour: {
            id: 2,
            name: 'Горный курорт "Красная поляна"',
            imageUrl: '/img/tours/krasnaya-polyana.jpg'
          },
          tourDate: {
            startDate: '2023-07-05',
            endDate: '2023-07-10'
          }
        }
      ]);
    }, 800);
  });
};

const mockCreateOrder = (bookingData: BookingData): Promise<Order> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: 3,
        userId: 2,
        tourId: parseInt(bookingData.tourId),
        tourDateId: bookingData.tourDateId,
        roomId: bookingData.roomId,
        peopleCount: bookingData.peopleCount,
        totalPrice: bookingData.totalPrice,
        status: 'pending',
        createdAt: new Date().toISOString(),
        tour: {
          id: parseInt(bookingData.tourId),
          name: 'Тур в Сочи', // В реальном API это придет с сервера
          imageUrl: '/img/tours/sochi.jpg'
        },
        tourDate: {
          startDate: '2023-06-15', // В реальном API это придет с сервера
          endDate: '2023-06-22'
        }
      });
    }, 800);
  });
};

const mockCancelOrder = (orderId: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 500);
  });
};

// Асинхронные action creators
export const fetchUserOrders = createAsyncThunk<
  Order[],
  void
>(
  'orders/fetchUserOrders',
  async (_, { rejectWithValue }) => {
    try {
      // В реальном приложении здесь будет запрос к API
      const response = await mockFetchUserOrders();
      return response;
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
      
      // В реальном приложении здесь будет запрос к API
      const response = await mockCreateOrder(bookingData);
      return response;
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
      // В реальном приложении здесь будет запрос к API
      await mockCancelOrder(orderId);
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
        const orderId = action.payload;
        const orderIndex = state.orders.findIndex(order => order.id === orderId);
        if (orderIndex !== -1) {
          state.orders[orderIndex].status = 'cancelled';
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { setBookingData, clearBookingData } = ordersSlice.actions;
export default ordersSlice.reducer; 