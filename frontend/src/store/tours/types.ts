// Основной интерфейс тура
export interface ITour {
  id: number;
  name: string;
  description: string;
  price: number; // базовая цена тура
  imageUrl: string;
  duration: number; // продолжительность в днях
  city: {
    id: number;
    name: string;
    country: {
      id: number;
      name: string;
      code: string;
    }
  };
  isActive: boolean;
  // другие свойства тура
}

// Интерфейс для фильтров туров
export interface ITourFilters {
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

// Интерфейс для пагинации
export interface IPaginationParams {
  page: number;
  size: number;
}

// Интерфейс ответа с серверва
export interface ITourResponse {
  tours: ITour[];
  total: number;
}

// Состояние хранилища туров
export interface IToursState {
  tours: ITour[];
  filters: ITourFilters;
  pagination: {
    page: number;
    size: number;
    total: number;
  };
  loading: boolean;
  error: string | null;
} 