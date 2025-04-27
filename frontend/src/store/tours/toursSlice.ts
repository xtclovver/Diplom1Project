import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { tourService } from '../../services/api';

// Типы данных
interface Tour {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  imageUrl: string;
  city: {
    id: number;
    name: string;
    country: {
      id: number;
      name: string;
      code: string;
    }
  };
  duration: number;
  isActive: boolean;
}

interface TourDate {
  id: number;
  tourId: number;
  startDate: string;
  endDate: string;
  availability: number;
  priceModifier: number;
}

interface TourFilters {
  countries?: number[];
  cities?: number[];
  priceMin?: number;
  priceMax?: number;
  dateFrom?: string;
  dateTo?: string;
  duration?: number[];
  peopleCount?: number;
  searchQuery?: string;
}

interface PaginationParams {
  page: number;
  size: number;
}

interface ToursState {
  tours: Tour[];
  tour: Tour | null;
  tourDates: TourDate[];
  filters: TourFilters;
  pagination: {
    page: number;
    size: number;
    total: number;
  };
  loading: boolean;
  error: string | null;
}

// Начальное состояние
const initialState: ToursState = {
  tours: [],
  tour: null,
  tourDates: [],
  filters: {},
  pagination: {
    page: 1,
    size: 10,
    total: 0
  },
  loading: false,
  error: null
};

// Асинхронные action creators
export const fetchTours = createAsyncThunk<
  { tours: Tour[]; total: number },
  { filters: TourFilters; page: number; size: number }
>(
  'tours/fetchTours',
  async ({ filters, page, size }, { rejectWithValue }) => {
    try {
      const response = await tourService.getTours(filters, page, size);
      return {
        tours: response.data.tours,
        total: response.data.total
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось загрузить туры');
    }
  }
);

export const fetchTourById = createAsyncThunk<
  Tour,
  string
>(
  'tours/fetchTourById',
  async (tourId, { rejectWithValue }) => {
    try {
      const response = await tourService.getTourById(tourId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось загрузить информацию о туре');
    }
  }
);

export const fetchTourDates = createAsyncThunk<
  TourDate[],
  string
>(
  'tours/fetchTourDates',
  async (tourId, { rejectWithValue }) => {
    try {
      const response = await tourService.getTourDates(tourId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось загрузить даты тура');
    }
  }
);

// Создание slice
const toursSlice = createSlice({
  name: 'tours',
  initialState,
  reducers: {
    // Устанавливаем фильтры
    setFilters: (state, action: PayloadAction<TourFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
      // Сбрасываем страницу при изменении фильтров
      state.pagination.page = 1;
    },
    // Очищаем фильтры
    clearFilters: (state) => {
      state.filters = {};
      state.pagination.page = 1;
    },
    // Устанавливаем страницу пагинации
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    // Устанавливаем размер страницы
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pagination.size = action.payload;
      state.pagination.page = 1; // Сбрасываем страницу при изменении размера
    },
    // Очищаем данные тура при переходе со страницы
    clearTourData: (state) => {
      state.tour = null;
      state.tourDates = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Обработка fetchTours
      .addCase(fetchTours.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTours.fulfilled, (state, action: PayloadAction<{ tours: Tour[]; total: number }>) => {
        state.loading = false;
        state.tours = action.payload.tours;
        state.pagination.total = action.payload.total;
      })
      .addCase(fetchTours.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Обработка fetchTourById
      .addCase(fetchTourById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTourById.fulfilled, (state, action: PayloadAction<Tour>) => {
        state.loading = false;
        state.tour = action.payload;
      })
      .addCase(fetchTourById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Обработка fetchTourDates
      .addCase(fetchTourDates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTourDates.fulfilled, (state, action: PayloadAction<TourDate[]>) => {
        state.loading = false;
        state.tourDates = action.payload;
      })
      .addCase(fetchTourDates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
  }
});

export const { setFilters, clearFilters, setPage, setPageSize, clearTourData } = toursSlice.actions;

export default toursSlice.reducer; 