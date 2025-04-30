import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { orderService } from '../../services/api';

// Начальное состояние
const initialState = {
  orders: [],
  order: null,
  loading: false,
  error: null,
  createOrderSuccess: false,
  pagination: {
    page: 1,
    size: 10,
    total: 0
  }
};

// Асинхронные action creators
/**
 * Создает новый заказ
 * @param {Object} orderData - Данные заказа
 * @param {number} orderData.tour_id - ID тура
 * @param {number} orderData.tour_date_id - ID даты тура
 * @param {number|null} [orderData.room_id] - ID номера (опционально)
 * @param {number} orderData.people_count - Количество человек
 */
export const createOrder = createAsyncThunk(
  'order/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      console.log('[OrderSlice] Отправка данных заказа:', orderData);
      const response = await orderService.createOrder(orderData);
      console.log('[OrderSlice] Успешный ответ от сервера:', response.data);
      return response.data;
    } catch (error) {
      console.error('[OrderSlice] Ошибка при создании заказа:', error.response?.data);
      return rejectWithValue(error.response?.data?.error || 'Ошибка при создании заказа');
    }
  }
);

export const fetchUserOrders = createAsyncThunk(
  'order/fetchUserOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await orderService.getUserOrders();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Ошибка при загрузке заказов');
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'order/fetchOrderById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await orderService.getOrderById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Ошибка при загрузке заказа');
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'order/cancelOrder',
  async (id, { rejectWithValue }) => {
    try {
      await orderService.cancelOrder(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Ошибка при отмене заказа');
    }
  }
);

// Slice
const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    resetCreateOrderSuccess: (state) => {
      state.createOrderSuccess = false;
      state.error = null;
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    setSize: (state, action) => {
      state.pagination.size = action.payload;
      state.pagination.page = 1; // Сбрасываем страницу при изменении размера
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Обработка createOrder
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.createOrderSuccess = false;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.order = action.payload;
        state.createOrderSuccess = true;
        // Добавляем новый заказ в начало списка, если он уже был загружен
        if (state.orders.length > 0) {
          state.orders.unshift(action.payload);
        }
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.createOrderSuccess = false;
      })
      
      // Обработка fetchUserOrders
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.items || action.payload;
        if (action.payload.total) {
          state.pagination.total = action.payload.total;
        }
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Обработка fetchOrderById
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.order = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Обработка cancelOrder
      .addCase(cancelOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading = false;
        // Обновляем статус заказа в списке и текущем заказе
        const canceledOrderId = action.payload;
        
        state.orders = state.orders.map(order => 
          order.id === canceledOrderId 
            ? { ...order, status: 'CANCELLED' } 
            : order
        );
        
        if (state.order && state.order.id === canceledOrderId) {
          state.order = { ...state.order, status: 'CANCELLED' };
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { resetCreateOrderSuccess, setPage, setSize, clearError } = orderSlice.actions;
export default orderSlice.reducer; 