import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { adminService } from '../../services/api';

// Типы для работы с турами
interface Tour {
  id?: number;
  name: string;
  description: string;
  basePrice: number;
  cityId: number;
  imageUrl: string;
  duration: number;
  isActive: boolean;
  city?: {
    id: number;
    name: string;
    country?: {
      id: number;
      name: string;
    }
  };
}

interface TourDate {
  id?: number;
  tourId: number;
  startDate: string;
  endDate: string;
  availability: number;
  priceModifier: number;
}

// Состояние админ-части для управления турами
interface AdminToursState {
  tours: Tour[];
  selectedTour: Tour | null;
  loading: boolean;
  error: string | null;
  success: string | null;
}

// Начальное состояние
const initialState: AdminToursState = {
  tours: [],
  selectedTour: null,
  loading: false,
  error: null,
  success: null
};

// Асинхронные операции
// 1. Получение списка туров
export const fetchTours = createAsyncThunk(
  'adminTours/fetchTours',
  async (_, { rejectWithValue }) => {
    try {
      // Проверяем существование adminService и его метода getAllTours
      if (!adminService || typeof adminService.getAllTours !== 'function') {
        console.error('[AdminTours] adminService.getAllTours не является функцией:', adminService);
        return rejectWithValue('Ошибка API: метод getAllTours недоступен');
      }
      
      const response = await adminService.getAllTours();
      // Проверяем формат ответа и адаптируем
      if (response.data && Array.isArray(response.data)) {
        // Нормализация данных с сервера: преобразование snake_case в camelCase
        return response.data.map((tour: any) => ({
          ...tour,
          basePrice: tour.basePrice || tour.base_price, // Поддержка обоих форматов полей
          base_price: tour.basePrice || tour.base_price // Дублируем для обратной совместимости
        }));
      } else if (response.data && (Array.isArray(response.data.tours) || Array.isArray(response.data.data))) {
        // Возврат массива из полей tours или data
        const toursData = response.data.tours || response.data.data;
        return toursData.map((tour: any) => ({
          ...tour,
          basePrice: tour.basePrice || tour.base_price,
          base_price: tour.basePrice || tour.base_price
        }));
      } else {
        console.error('[AdminTours] Неожиданная структура ответа API:', response.data);
        return rejectWithValue('Неожиданный формат данных от сервера');
      }
    } catch (error: any) {
      console.error('[AdminTours] Ошибка при загрузке туров:', error);
      return rejectWithValue(error.response?.data?.message || 'Не удалось загрузить туры');
    }
  }
);

// 2. Создание нового тура
export const createTour = createAsyncThunk(
  'adminTours/createTour',
  async (tourData: Tour, { rejectWithValue }) => {
    try {
      const response = await adminService.createTour(tourData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось создать тур');
    }
  }
);

// 3. Обновление существующего тура
export const updateTour = createAsyncThunk(
  'adminTours/updateTour',
  async (tourData: Tour, { rejectWithValue }) => {
    if (!tourData.id) {
      return rejectWithValue('Отсутствует ID тура');
    }
    
    try {
      const response = await adminService.updateTour(tourData.id, tourData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось обновить тур');
    }
  }
);

// 4. Удаление тура
export const deleteTour = createAsyncThunk(
  'adminTours/deleteTour',
  async (tourId: number, { rejectWithValue }) => {
    try {
      await adminService.deleteTour(tourId);
      return tourId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось удалить тур');
    }
  }
);

// 5. Получение дат тура
export const fetchTourDates = createAsyncThunk(
  'adminTours/fetchTourDates',
  async (tourId: number, { rejectWithValue }) => {
    try {
      const response = await adminService.getTourDates(tourId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось загрузить даты тура');
    }
  }
);

// 6. Добавление новой даты тура
export const addTourDate = createAsyncThunk(
  'adminTours/addTourDate',
  async (tourDateData: TourDate, { rejectWithValue }) => {
    try {
      const response = await adminService.addTourDate(tourDateData.tourId, tourDateData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось добавить дату тура');
    }
  }
);

// 7. Обновление даты тура
export const updateTourDate = createAsyncThunk(
  'adminTours/updateTourDate',
  async (tourDateData: TourDate, { rejectWithValue }) => {
    if (!tourDateData.id) {
      return rejectWithValue('Отсутствует ID даты тура');
    }
    
    try {
      const response = await adminService.updateTourDate(
        tourDateData.tourId, 
        tourDateData.id, 
        tourDateData
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось обновить дату тура');
    }
  }
);

// 8. Удаление даты тура
export const deleteTourDate = createAsyncThunk(
  'adminTours/deleteTourDate',
  async ({ tourId, dateId }: { tourId: number; dateId: number }, { rejectWithValue }) => {
    try {
      await adminService.deleteTourDate(tourId, dateId);
      return { tourId, dateId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось удалить дату тура');
    }
  }
);

// Создание слайса
const adminToursSlice = createSlice({
  name: 'adminTours',
  initialState,
  reducers: {
    // Установка выбранного тура для редактирования
    setSelectedTour: (state, action: PayloadAction<Tour | null>) => {
      state.selectedTour = action.payload;
    },
    // Очистка сообщения об ошибке
    clearError: (state) => {
      state.error = null;
    },
    // Очистка сообщения об успешной операции
    clearSuccess: (state) => {
      state.success = null;
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
        state.tours = action.payload || [];
      })
      .addCase(fetchTours.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Произошла ошибка при загрузке туров';
      })
      
      // Обработка createTour
      .addCase(createTour.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTour.fulfilled, (state, action) => {
        state.loading = false;
        state.tours.push(action.payload);
        state.success = 'Тур успешно создан';
      })
      .addCase(createTour.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Произошла ошибка при создании тура';
      })
      
      // Обработка updateTour
      .addCase(updateTour.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTour.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tours.findIndex(tour => tour.id === action.payload.id);
        if (index !== -1) {
          state.tours[index] = action.payload;
        }
        state.success = 'Тур успешно обновлен';
      })
      .addCase(updateTour.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Произошла ошибка при обновлении тура';
      })
      
      // Обработка deleteTour
      .addCase(deleteTour.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTour.fulfilled, (state, action) => {
        state.loading = false;
        state.tours = state.tours.filter(tour => tour.id !== action.payload);
        state.success = 'Тур успешно удален';
      })
      .addCase(deleteTour.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Произошла ошибка при удалении тура';
      })
      
      // Обработка остальных операций с датами туров
      // Эти операции не изменяют основной список туров, поэтому влияют только на loading/error/success
      .addCase(addTourDate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTourDate.fulfilled, (state) => {
        state.loading = false;
        state.success = 'Дата тура успешно добавлена';
      })
      .addCase(addTourDate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Произошла ошибка при добавлении даты тура';
      })
      
      .addCase(updateTourDate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTourDate.fulfilled, (state) => {
        state.loading = false;
        state.success = 'Дата тура успешно обновлена';
      })
      .addCase(updateTourDate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Произошла ошибка при обновлении даты тура';
      })
      
      .addCase(deleteTourDate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTourDate.fulfilled, (state) => {
        state.loading = false;
        state.success = 'Дата тура успешно удалена';
      })
      .addCase(deleteTourDate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Произошла ошибка при удалении даты тура';
      });
  }
});

// Экспорт экшенов
export const { setSelectedTour, clearError, clearSuccess } = adminToursSlice.actions;

// Экспорт редьюсера
export default adminToursSlice.reducer; 