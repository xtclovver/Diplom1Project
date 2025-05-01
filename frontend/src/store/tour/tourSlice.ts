import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { tourService } from '../../services/api';

// Типы
export interface Tour {
  id: number;
  name: string;
  description: string;
  base_price: number;
  image_url: string;
  duration: number;
  popularity: number;
  city: {
    id: number;
    name: string;
    country: {
      id: number;
      name: string;
    };
  };
}

export interface TourFilters {
  country?: string;
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  people?: number;
  priceMin?: string;
  priceMax?: string;
}

interface PaginationState {
  page: number;
  size: number;
  total: number;
}

interface TourState {
  tours: Tour[];
  tour: Tour | null;
  tourDates: any[];
  loading: boolean;
  error: string | null;
  filters: TourFilters;
  pagination: PaginationState;
}

// Начальное состояние
const initialState: TourState = {
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

// Интерфейс параметров для fetchTours
export interface FetchToursParams {
  filters: TourFilters;
  page: number;
  size: number;
}

// Интерфейс ответа fetchTours
interface FetchToursResponse {
  tours: Tour[];
  total: number;
}

// Асинхронные action creators
export const fetchTours = createAsyncThunk<FetchToursResponse, FetchToursParams>(
  'tour/fetchTours',
  async (params) => {
    try {
      // Преобразуем строковые цены в числа перед передачей в сервис
      const numericFilters = {
        ...params.filters,
        priceMin: params.filters.priceMin ? parseFloat(params.filters.priceMin) : undefined,
        priceMax: params.filters.priceMax ? parseFloat(params.filters.priceMax) : undefined,
      };
      // Удаляем NaN значения, если parseFloat не смог распарсить
      if (isNaN(numericFilters.priceMin as number)) numericFilters.priceMin = undefined;
      if (isNaN(numericFilters.priceMax as number)) numericFilters.priceMax = undefined;

      const response = await tourService.getTours(numericFilters, params.page, params.size);
      return {
        // Предполагаем, что API возвращает данные, соответствующие интерфейсу Tour из этого файла
        tours: response.data.items,
        total: response.data.total
      };
    } catch (error: any) {
      throw error.response?.data?.error || 'Ошибка при загрузке туров';
    }
  }
);

// Fetch single tour
export const fetchTourById = createAsyncThunk<Tour, string>(
  'tour/fetchTourById',
  async (id) => {
    try {
      const response = await tourService.getTourById(id);
      return response.data;
    } catch (error: any) {
      throw error.response?.data?.error || 'Ошибка при загрузке тура';
    }
  }
);

// Fetch tour dates
export const fetchTourDates = createAsyncThunk<any[], string>(
  'tour/fetchTourDates',
  async (tourId) => {
    try {
      const response = await tourService.getTourDates(tourId);
      return response.data;
    } catch (error: any) {
      throw error.response?.data?.error || 'Ошибка при загрузке дат тура';
    }
  }
);

// Slice
const tourSlice = createSlice({
  name: 'tour',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<TourFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // Сбрасываем страницу при изменении фильтров
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    setSize: (state, action: PayloadAction<number>) => {
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
        state.error = action.error.message || 'Произошла ошибка';
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
        state.error = action.error.message || 'Произошла ошибка при загрузке тура';
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
        state.error = action.error.message || 'Произошла ошибка при загрузке дат тура';
      });
  }
});

export const { setFilters, clearFilters, setPage, setSize, clearError } = tourSlice.actions;
export default tourSlice.reducer; 