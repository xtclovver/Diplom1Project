import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

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

// API mock (в реальном приложении здесь будут реальные запросы к API)
const mockFetchTours = (filters: TourFilters, pagination: PaginationParams): Promise<{ tours: Tour[], total: number }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Имитация данных с сервера
      const mockTours: Tour[] = [
        {
          id: 1,
          name: 'Тур в Сочи',
          description: 'Отличный тур для отдыха на побережье Чёрного моря.',
          basePrice: 25000,
          imageUrl: '/img/tours/sochi.jpg',
          city: {
            id: 1,
            name: 'Сочи',
            country: {
              id: 1,
              name: 'Россия',
              code: 'RU'
            }
          },
          duration: 7,
          isActive: true
        },
        {
          id: 2,
          name: 'Горный курорт "Красная поляна"',
          description: 'Активный отдых в горах, катание на лыжах и сноуборде.',
          basePrice: 30000,
          imageUrl: '/img/tours/krasnaya-polyana.jpg',
          city: {
            id: 2,
            name: 'Красная Поляна',
            country: {
              id: 1,
              name: 'Россия',
              code: 'RU'
            }
          },
          duration: 5,
          isActive: true
        },
        {
          id: 3,
          name: 'Экскурсия по Москве',
          description: 'Посещение главных достопримечательностей столицы.',
          basePrice: 15000,
          imageUrl: '/img/tours/moscow.jpg',
          city: {
            id: 3,
            name: 'Москва',
            country: {
              id: 1,
              name: 'Россия',
              code: 'RU'
            }
          },
          duration: 3,
          isActive: true
        }
      ];
      
      // В реальном приложении здесь была бы фильтрация по параметрам
      
      resolve({
        tours: mockTours,
        total: mockTours.length
      });
    }, 800);
  });
};

const mockFetchTourById = (tourId: string): Promise<Tour> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Имитация данных с сервера
      const tour = {
        id: 1,
        name: 'Тур в Сочи',
        description: 'Отличный тур для отдыха на побережье Чёрного моря. Вас ждут прекрасные пляжи, теплое море и множество развлечений.',
        basePrice: 25000,
        imageUrl: '/img/tours/sochi.jpg',
        city: {
          id: 1,
          name: 'Сочи',
          country: {
            id: 1,
            name: 'Россия',
            code: 'RU'
          }
        },
        duration: 7,
        isActive: true
      };
      
      if (tourId === '1') {
        resolve(tour);
      } else {
        reject(new Error('Тур не найден'));
      }
    }, 500);
  });
};

const mockFetchTourDates = (tourId: string): Promise<TourDate[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (tourId === '1') {
        resolve([
          {
            id: 1,
            tourId: 1,
            startDate: '2023-06-01',
            endDate: '2023-06-08',
            availability: 15,
            priceModifier: 1.0
          },
          {
            id: 2,
            tourId: 1,
            startDate: '2023-06-15',
            endDate: '2023-06-22',
            availability: 10,
            priceModifier: 1.1
          },
          {
            id: 3,
            tourId: 1,
            startDate: '2023-07-01',
            endDate: '2023-07-08',
            availability: 8,
            priceModifier: 1.2
          }
        ]);
      } else {
        resolve([]);
      }
    }, 500);
  });
};

// Асинхронные action creators
export const fetchTours = createAsyncThunk<
  { tours: Tour[]; total: number },
  { filters: TourFilters; page: number; size: number }
>(
  'tours/fetchTours',
  async ({ filters, page, size }, { rejectWithValue }) => {
    try {
      // В реальном приложении здесь будет запрос к API
      const response = await mockFetchTours(filters, { page, size });
      return response;
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
      // В реальном приложении здесь будет запрос к API
      const response = await mockFetchTourById(tourId);
      return response;
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
      // В реальном приложении здесь будет запрос к API
      const response = await mockFetchTourDates(tourId);
      return response;
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
    setFilters: (state, action: PayloadAction<TourFilters>) => {
      state.filters = action.payload;
      state.pagination.page = 1; // Сброс на первую страницу при изменении фильтров
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    setSize: (state, action: PayloadAction<number>) => {
      state.pagination.size = action.payload;
      state.pagination.page = 1; // Сброс на первую страницу при изменении размера
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
      });
  }
});

export const { setFilters, setPage, setSize } = toursSlice.actions;
export default toursSlice.reducer; 