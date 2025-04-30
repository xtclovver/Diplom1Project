// Интерфейс для даты проведения тура
export interface ITourDate {
  id: number;
  tourId: number;
  startDate: string;
  endDate: string;
  availability: number; // количество доступных мест
  priceModifier: number; // модификатор цены для конкретной даты (например, 1.2 для +20%)
}

// Отдельный тур
export interface ISingleTour {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  duration: number;
  city: {
    id: number;
    name: string;
    country: {
      id: number;
      name: string;
    }
  };
  gallery?: string[]; // массив URL изображений для галереи
  program?: ITourProgram[]; // программа тура по дням
  included?: string[]; // что включено в тур
  excluded?: string[]; // что не включено в тур
  reviews?: ITourReview[]; // отзывы по туру
}

// Интерфейс для программы тура
export interface ITourProgram {
  day: number;
  title: string;
  description: string;
  imageUrl?: string;
}

// Интерфейс для отзыва
export interface ITourReview {
  id: number;
  userId: number;
  userName: string;
  rating: number; // оценка от 1 до 5
  comment: string;
  date: string;
}

// Состояние для хранилища отдельного тура
export interface ITourState {
  tour: ISingleTour | null;
  tourDates: ITourDate[];
  selectedDate: ITourDate | null;
  loading: boolean;
  error: string | null;
} 