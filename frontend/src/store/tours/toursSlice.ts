import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { tourService } from '../../services/api';

// Интерфейс для ПОЛНОЙ информации о туре (используется для state.tour)
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
  // Могут быть добавлены другие поля для детального просмотра
}

// Интерфейс для СОКРАЩЕННОЙ информации о туре (используется для state.tours - списка)
interface TourSummary {
  id: number;
  name: string;
  description: string; // Краткое описание?
  basePrice: number;
  imageUrl: string;
  cityId: number; // Используем ID города для списка
  cityName?: string; // Опционально, если API возвращает
  countryName?: string; // Опционально, если API возвращает
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
  tours: TourSummary[]; // Используем TourSummary для списка
  tour: Tour | null; // Используем Tour для детальной информации
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

// Тип данных, как они приходят от API
interface RawTourData {
  id: number;
  name: string;
  description: string;
  base_price: number; // snake_case
  image_url: string; // snake_case
  city_id: number; // snake_case
  duration: number;
  is_active: boolean;
  created_at: string; // snake_case
  // Могут быть и другие поля от API
  [key: string]: any;
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
  { tours: TourSummary[]; total: number }, // Возвращаем TourSummary
  { filters: TourFilters; page: number; size: number }
>(
  'tours/fetchTours',
  async ({ filters, page, size }, { rejectWithValue }) => {
    try {
      const response = await tourService.getTours(filters, page, size);
      // Указываем тип RawTourData для tour
      const toursData = response.data.tours as RawTourData[];
      
      return {
        tours: toursData.map((tour: RawTourData): TourSummary => ({
          // Преобразуем поля к camelCase, соответствующему интерфейсу TourSummary
          id: tour.id,
          name: tour.name,
          description: tour.description,
          basePrice: tour.base_price,
          imageUrl: tour.image_url,
          cityId: tour.city_id, // Добавляем cityId
          // cityName: tour.city_name, // Если API возвращает имя города
          // countryName: tour.country_name, // Если API возвращает имя страны
          duration: tour.duration,
          isActive: tour.is_active,
        })),
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
      // Указываем, что response.data имеет тип RawTourData (или более точный тип ответа API)
      const rawData: RawTourData = response.data;

      // Преобразуем snake_case в camelCase
      const transformedData: Tour = {
        id: rawData.id,
        name: rawData.name,
        description: rawData.description,
        basePrice: rawData.base_price, // Преобразование
        imageUrl: rawData.image_url,   // Преобразование
        city: rawData.city, // Предполагаем, что city уже в нужном формате или его тоже нужно преобразовать
        duration: rawData.duration,
        isActive: rawData.is_active, // Преобразование
        // Добавьте преобразование для других полей при необходимости
        // Например, если city приходит как city_id, нужно будет его загрузить или обработать иначе
      };

      return transformedData; // Возвращаем преобразованные данные
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
      .addCase(fetchTours.fulfilled, (state, action: PayloadAction<{ tours: TourSummary[]; total: number }>) => {
        state.loading = false;
        // Здесь приходят данные типа TourSummary[]
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
      .addCase(fetchTourDates.fulfilled, (state, action: PayloadAction<any[]>) => { // Принимаем any[], так как API возвращает snake_case
        state.loading = false;
        // Преобразуем snake_case из API в camelCase для нашего состояния и интерфейса TourDate
        state.tourDates = action.payload.map((date: any) => ({
          id: date.id,
          tourId: date.tour_id, // Преобразуем tour_id
          startDate: date.start_date, // Преобразуем start_date
          endDate: date.end_date, // Преобразуем end_date
          availability: date.availability,
          priceModifier: date.price_modifier // Преобразуем price_modifier
        }));
      })
      .addCase(fetchTourDates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
  }
});

export const { setFilters, clearFilters, setPage, setPageSize, clearTourData } = toursSlice.actions;

export default toursSlice.reducer; 