import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tourService } from '../../services/api';

// Начальное состояние
const initialState = {
  tours: [],
  tour: null,
  tourDates: [],
  loading: false,
  error: null,
  filters: {
    country: '',
    city: '',
    dateFrom: '',
    dateTo: '',
    people: 1,
    priceMin: '',
    priceMax: ''
  },
  pagination: {
    page: 1,
    size: 10,
    total: 0
  }
};

// Асинхронные action creators
export const fetchTours = createAsyncThunk(
  'tour/fetchTours',
  async ({ filters, page, size }, { rejectWithValue }) => {
    try {
      const response = await tourService.getTours(filters, page, size);
      return {
        tours: response.data.items,
        total: response.data.total
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Ошибка при загрузке туров');
    }
  }
);

export const fetchTourById = createAsyncThunk(
  'tour/fetchTourById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await tourService.getTourById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Ошибка при загрузке тура');
    }
  }
);

export const fetchTourDates = createAsyncThunk(
  'tour/fetchTourDates',
  async (id, { rejectWithValue }) => {
    try {
      const response = await tourService.getTourDates(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Ошибка при загрузке дат тура');
    }
  }
);

// Slice
const tourSlice = createSlice({
  name: 'tour',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // Сбрасываем страницу при изменении фильтров
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
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
      // Обработка fetchTours
      .addCase(fetchTours.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTours.fulfilled, (state, action) => {
        state.loading = false;
        state.tours = action.payload.tours;
        state.pagination.total = action.payload.total;
      })
      .addCase(fetchTours.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Обработка fetchTourById
      .addCase(fetchTourById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTourById.fulfilled, (state, action) => {
        state.loading = false;
        state.tour = action.payload;
      })
      .addCase(fetchTourById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Обработка fetchTourDates
      .addCase(fetchTourDates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTourDates.fulfilled, (state, action) => {
        state.loading = false;
        state.tourDates = action.payload;
      })
      .addCase(fetchTourDates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { setFilters, clearFilters, setPage, setSize, clearError } = tourSlice.actions;
export default tourSlice.reducer; 