import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { 
  fetchTours, 
  createTour, 
  updateTour, 
  deleteTour,
  fetchTourDates,
  addTourDate,
  updateTourDate,
  deleteTourDate,
  setSelectedTour,
  clearError,
  clearSuccess 
} from '../../store/admin/adminToursSlice';
import './AdminTours.css';

// Типы данных
interface TourFormData {
  name: string;
  description: string;
  basePrice: number;
  cityId: number;
  imageUrl: string;
  duration: number;
  isActive: boolean;
}

interface TourDateFormData {
  startDate: string;
  endDate: string;
  availability: number;
  priceModifier: number;
}

// Компонент для управления турами в админ-панели
const AdminTours: React.FC = () => {
  const dispatch = useDispatch();
  const { tours, selectedTour, loading, error, success } = useSelector((state: RootState) => state.adminTours);
  
  // Состояния компонента
  const [formData, setFormData] = useState<TourFormData>({
    name: '',
    description: '',
    basePrice: 0,
    cityId: 0,
    imageUrl: '',
    duration: 0,
    isActive: true
  });
  
  const [dateFormData, setDateFormData] = useState<TourDateFormData>({
    startDate: '',
    endDate: '',
    availability: 30,
    priceModifier: 1.0
  });
  
  // Состояния для управления интерфейсом
  const [cities, setCities] = useState<any[]>([]);
  const [citiesError, setCitiesError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'tours' | 'dates' | 'edit'>('tours');
  const [currentTourId, setCurrentTourId] = useState<number | null>(null);
  const [selectedTourDates, setSelectedTourDates] = useState<any[]>([]);
  const [currentDateId, setCurrentDateId] = useState<number | null>(null);
  const [isCreatingTour, setIsCreatingTour] = useState<boolean>(false);
  const [isEditingDate, setIsEditingDate] = useState<boolean>(false);
  const [isCreatingDate, setIsCreatingDate] = useState<boolean>(false);

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    dispatch(fetchTours() as any)
      .then((action: any) => {
        if (action.payload && Array.isArray(action.payload)) {
          console.log('[AdminTours] Загруженные туры:', action.payload);
          console.log('[AdminTours] URL изображений:', action.payload.map((t: any) => ({
            id: t.id,
            name: t.name,
            imageUrl: t.imageUrl,
            image_url: (t as any).image_url
          })));
        }
      });
    fetchCities();
  }, [dispatch]);
  
  // Загрузка дат тура при изменении текущего тура
  useEffect(() => {
    if (currentTourId && viewMode === 'dates') {
      dispatch(fetchTourDates(currentTourId) as any)
        .then((action: any) => {
          if (action.payload) {
            setSelectedTourDates(action.payload);
          }
        });
    }
  }, [currentTourId, viewMode, dispatch]);
  
  // Очистка сообщений об ошибках и успешных операциях
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        dispatch(clearError());
        dispatch(clearSuccess());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success, dispatch]);
  
  // Загрузка списка городов
  const fetchCities = async () => {
    try {
      setCitiesError(null);
      const response = await fetch('/api/cities');
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      if (data && Array.isArray(data.data)) {
        setCities(data.data);
      } else {
        setCitiesError('Получен некорректный формат данных городов');
        setCities([]);
      }
    } catch (error) {
      setCitiesError(error instanceof Error ? error.message : 'Ошибка при загрузке списка городов');
      setCities([]);
    }
  };
  
  // Обработчики операций с турами
  const handleAddTourClick = () => {
    setIsCreatingTour(true);
    setViewMode('edit');
    dispatch(setSelectedTour(null));
    setFormData({
      name: '',
      description: '',
      basePrice: 0,
      cityId: cities.length > 0 ? cities[0].id : 0,
      imageUrl: '',
      duration: 1,
      isActive: true
    });
  };
  
  const handleEditTourClick = (tour: any) => {
    setIsCreatingTour(false);
    setViewMode('edit');
    dispatch(setSelectedTour(tour));
    setFormData({
      name: tour.name,
      description: tour.description,
      basePrice: tour.basePrice,
      cityId: tour.cityId,
      imageUrl: tour.imageUrl || (tour as any).image_url || '',
      duration: tour.duration,
      isActive: tour.isActive
    });
  };
  
  const handleSaveTour = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tourData = isCreatingTour
      ? formData
      : { ...formData, id: selectedTour?.id };

    if (isCreatingTour) {
      dispatch(createTour(tourData) as any);
    } else {
      dispatch(updateTour(tourData) as any);
    }
    
    setViewMode('tours');
  };
  
  const handleDeleteTour = (tourId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот тур?')) {
      dispatch(deleteTour(tourId) as any);
    }
  };
  
  const handleCancelEdit = () => {
    setViewMode('tours');
  };
  
  // Обработчики операций с датами туров
  const handleViewTourDates = (tourId: number) => {
    console.log(`[AdminTours] Просмотр дат тура с ID ${tourId}`);
    setCurrentTourId(tourId);
    setViewMode('dates');
    
    try {
      dispatch(fetchTourDates(tourId) as any)
        .then((action: any) => {
          console.log('[AdminTours] Результат запроса дат тура:', action);
          if (action.payload) {
            console.log('[AdminTours] Загруженные даты:', action.payload);
            if (Array.isArray(action.payload)) {
              setSelectedTourDates(action.payload);
            } else {
              console.error('[AdminTours] Неожиданный формат данных:', action.payload);
              setSelectedTourDates([]);
            }
          } else if (action.error) {
            console.error('[AdminTours] Ошибка при загрузке дат тура:', action.error);
            setSelectedTourDates([]);
          } else {
            console.error('[AdminTours] Пустой ответ при загрузке дат тура');
            setSelectedTourDates([]);
          }
        })
        .catch((error: any) => {
          console.error('[AdminTours] Ошибка при загрузке дат тура:', error);
          setSelectedTourDates([]);
        });
    } catch (error) {
      console.error('[AdminTours] Исключение при загрузке дат тура:', error);
      setSelectedTourDates([]);
    }
  };
  
  const handleAddDateClick = () => {
    setIsCreatingDate(true);
    setIsEditingDate(true);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 7);
    
    setDateFormData({
      startDate: today.toISOString().split('T')[0],
      endDate: tomorrow.toISOString().split('T')[0],
      availability: 30,
      priceModifier: 1.0
    });
  };
  
  const handleEditDateClick = (date: any) => {
    setIsCreatingDate(false);
    setIsEditingDate(true);
    setCurrentDateId(date.id);
    
    // Обрабатываем разные форматы полей (camelCase и snake_case)
    setDateFormData({
      startDate: date.startDate || date.start_date,
      endDate: date.endDate || date.end_date,
      availability: date.availability,
      priceModifier: date.priceModifier || date.price_modifier
    });
    
    console.log('[AdminTours] Редактирование даты:', {
      id: date.id,
      исходные_данные: date,
      startDate: date.startDate || date.start_date,
      endDate: date.endDate || date.end_date,
      availability: date.availability,
      priceModifier: date.priceModifier || date.price_modifier
    });
  };
  
  const handleSaveDate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentTourId) {
      console.error('[AdminTours] Ошибка: отсутствует ID тура для сохранения даты');
      return;
    }
    
    console.log(`[AdminTours] Сохранение даты для тура ${currentTourId}:`, dateFormData);
    
    const dateData = {
      ...dateFormData,
      tourId: currentTourId
    };
    
    try {
      if (isCreatingDate) {
        console.log(`[AdminTours] Создание новой даты для тура ${currentTourId}`);
        dispatch(addTourDate(dateData) as any)
          .then((action: any) => {
            console.log('[AdminTours] Результат создания даты:', action);
            if (action.type.endsWith('/fulfilled')) {
              setIsEditingDate(false);
              // Обновляем список дат
              dispatch(fetchTourDates(currentTourId) as any)
                .then((action: any) => {
                  if (action.payload && Array.isArray(action.payload)) {
                    setSelectedTourDates(action.payload);
                  }
                });
            }
          })
          .catch((error: any) => {
            console.error('[AdminTours] Ошибка при создании даты тура:', error);
          });
      } else {
        console.log(`[AdminTours] Обновление даты ${currentDateId} для тура ${currentTourId}`);
        dispatch(updateTourDate({ ...dateData, id: currentDateId } as any) as any)
          .then((action: any) => {
            console.log('[AdminTours] Результат обновления даты:', action);
            if (action.type.endsWith('/fulfilled')) {
              setIsEditingDate(false);
              // Обновляем список дат
              dispatch(fetchTourDates(currentTourId) as any)
                .then((action: any) => {
                  if (action.payload && Array.isArray(action.payload)) {
                    setSelectedTourDates(action.payload);
                  }
                });
            }
          })
          .catch((error: any) => {
            console.error('[AdminTours] Ошибка при обновлении даты тура:', error);
          });
      }
    } catch (error) {
      console.error('[AdminTours] Критическая ошибка при сохранении даты тура:', error);
    }
  };
  
  const handleDeleteDate = (dateId: number) => {
    if (!currentTourId || !window.confirm('Вы уверены, что хотите удалить эту дату?')) return;
    
    dispatch(deleteTourDate({ tourId: currentTourId, dateId }) as any)
      .then((action: any) => {
        console.log('[AdminTours] Результат удаления даты:', action);
        if (action.type.endsWith('/fulfilled')) {
          // Обновляем список дат
          dispatch(fetchTourDates(currentTourId) as any)
            .then((action: any) => {
              if (action.payload && Array.isArray(action.payload)) {
                setSelectedTourDates(action.payload);
              }
            });
        }
      })
      .catch((error: any) => {
        console.error('[AdminTours] Ошибка при удалении даты тура:', error);
      });
  };
  
  const handleCancelDateEdit = () => {
    setIsEditingDate(false);
  };
  
  const handleBackToTours = () => {
    setViewMode('tours');
    setCurrentTourId(null);
    setSelectedTourDates([]);
  };
  
  // Обработчики форм
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : type === 'number' || name === 'basePrice' || name === 'duration'
        ? parseFloat(value) 
        : value
    }));
  };
  
  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setDateFormData(prev => ({
      ...prev,
      [name]: type === 'number' || name === 'availability' || name === 'priceModifier'
        ? parseFloat(value) 
        : value
    }));
  };
  
  // Функции фильтрации
  const filteredTours = tours.filter(tour => 
    tour.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tour.description && tour.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (tour.city && tour.city.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (tour.city && tour.city.country && tour.city.country.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const getCityName = (cityId: number) => {
    const city = cities.find(c => c.id === cityId);
    return city ? city.name : 'Не указан';
  };
  
  const getImageUrl = (tour: any): string => {
    // Пробуем получить URL изображения из разных возможных источников
    const url = tour.imageUrl || (tour as any).image_url || '';
    console.log(`[AdminTours] imageUrl для тура ${tour.id}:`, {
      imageUrl: tour.imageUrl,
      image_url: (tour as any).image_url,
      resultUrl: url
    });
    return url;
  };
  
  // Вспомогательная функция для безопасного получения значений из разных форматов
  const getDateValue = (date: any, camelCase: string, snakeCase: string) => {
    if (date[camelCase] !== undefined) return date[camelCase];
    if (date[snakeCase] !== undefined) return date[snakeCase];
    return null;
  };

  // Форматирование даты из строки ISO в локальный формат
  const formatDate = (isoDate: string) => {
    try {
      if (!isoDate) return 'Не указана';
      return new Date(isoDate).toLocaleDateString('ru');
    } catch (e) {
      console.error('[AdminTours] Ошибка форматирования даты:', e, isoDate);
      return 'Ошибка формата';
    }
  };
  
  // Рендеринг интерфейса
  // 1. Отображение сообщения об ошибке/успехе
  const renderNotifications = () => (
    <div className="admin-notifications">
      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}
      {citiesError && <div className="admin-error">{citiesError}</div>}
    </div>
  );
  
  // 2. Форма редактирования тура
  const renderTourForm = () => (
    <div className="tour-form-container">
      <h2>{isCreatingTour ? 'Создать новый тур' : 'Редактировать тур'}</h2>
      
      <form onSubmit={handleSaveTour} className="tour-form">
        <div className="form-group">
          <label htmlFor="name">Название тура</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="cityId">Город</label>
          <select
            id="cityId"
            name="cityId"
            value={formData.cityId}
            onChange={handleInputChange}
            required
          >
            <option value="">Выберите город</option>
            {cities.map(city => (
              <option key={city.id} value={city.id}>
                {city.name} ({city.country?.name || 'Неизвестная страна'})
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Описание</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={5}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="basePrice">Базовая цена (руб.)</label>
          <input
            type="number"
            id="basePrice"
            name="basePrice"
            value={formData.basePrice}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="duration">Продолжительность (дней)</label>
          <input
            type="number"
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleInputChange}
            min="1"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="imageUrl">URL изображения</label>
          <div className="image-url-input-group">
            <input
              type="text"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleInputChange}
              placeholder="Например: /images/tours/sochi_ski.jpg"
            />
            {formData.imageUrl && (
              <button 
                type="button" 
                className="copy-url-button"
                onClick={() => {
                  const fullUrl = formData.imageUrl.startsWith('http') 
                    ? formData.imageUrl 
                    : `${window.location.origin}${formData.imageUrl}`;
                  navigator.clipboard.writeText(fullUrl);
                  alert('URL скопирован в буфер обмена');
                }}
                title="Скопировать полный URL"
              >
                <span className="copy-icon">📋</span>
              </button>
            )}
          </div>
          {formData.imageUrl && (
            <div className="image-preview">
              <img 
                src={formData.imageUrl.startsWith('http') ? formData.imageUrl : `${formData.imageUrl}`} 
                alt="Предпросмотр изображения тура"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                  (e.target as HTMLImageElement).style.opacity = '0.5';
                }} 
              />
            </div>
          )}
          <small className="form-hint">Укажите относительный путь к изображению, например, из БД: /images/tours/sochi_ski.jpg</small>
        </div>
        
        <div className="form-group checkbox-group">
          <label htmlFor="isActive">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
            />
            Активен
          </label>
        </div>
        
        <div className="form-buttons">
          <button type="submit" className="admin-button save-button">
            {isCreatingTour ? 'Создать тур' : 'Сохранить изменения'}
          </button>
          <button 
            type="button" 
            className="admin-button cancel-button"
            onClick={handleCancelEdit}
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
  
  // 3. Список туров
  const renderToursList = () => (
    <div className="tours-list-container">
      <div className="admin-header">
        <h2>Управление турами</h2>
        <div className="admin-actions">
          <div className="search-container">
            <input
              type="text"
              placeholder="Поиск туров..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <button 
            className="admin-button add-button"
            onClick={handleAddTourClick}
          >
            Добавить тур
          </button>
        </div>
      </div>
      
      {renderNotifications()}
      
      <div className="tours-table-container">
        <table className="admin-table tours-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Изображение</th>
              <th>Город</th>
              <th>Цена</th>
              <th>Продолжительность</th>
              <th>Активен</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="loading-cell">Загрузка...</td>
              </tr>
            ) : filteredTours.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-cell">
                  {searchQuery ? 'Туры не найдены' : 'Список туров пуст'}
                </td>
              </tr>
            ) : (
              filteredTours.map(tour => (
                <tr key={tour.id} className={tour.isActive ? 'active-row' : 'inactive-row'}>
                  <td>{tour.id}</td>
                  <td>{tour.name}</td>
                  <td>
                    {getImageUrl(tour) ? (
                      <div className="image-cell" title={`URL: ${getImageUrl(tour)}`}>
                        <img 
                          src={getImageUrl(tour).startsWith('http') ? getImageUrl(tour) : `${getImageUrl(tour)}`} 
                          alt={tour.name}
                          className="tour-image-preview"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                            (e.target as HTMLImageElement).style.opacity = '0.5';
                          }}
                        />
                        <span className="image-url-tooltip">{getImageUrl(tour)}</span>
                      </div>
                    ) : (
                      <span className="no-image">Нет фото</span>
                    )}
                  </td>
                  <td>{tour.city?.name || getCityName(tour.cityId)}</td>
                  <td className="price-cell">{tour.basePrice?.toLocaleString('ru') || (tour as any).base_price?.toLocaleString('ru')} ₽</td>
                  <td>{tour.duration} {tour.duration === 1 ? 'день' : tour.duration < 5 ? 'дня' : 'дней'}</td>
                  <td>
                    <span className={`status-badge ${tour.isActive ? 'active' : 'inactive'}`}>
                      {tour.isActive ? 'Да' : 'Нет'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="table-button view-button"
                      onClick={() => handleViewTourDates(tour.id!)}
                      title="Даты тура"
                    >
                      Даты
                    </button>
                    <button
                      className="table-button edit-button"
                      onClick={() => handleEditTourClick(tour)}
                      title="Редактировать тур"
                    >
                      Редактировать
                    </button>
                    <button
                      className="table-button delete-button"
                      onClick={() => handleDeleteTour(tour.id!)}
                      title="Удалить тур"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
  
  // 4. Форма редактирования даты тура
  const renderDateForm = () => (
    <div className="date-form-container">
      <h3>{isCreatingDate ? 'Добавить новую дату' : 'Редактировать дату'}</h3>
      
      <form onSubmit={handleSaveDate} className="date-form">
        <div className="form-group">
          <label htmlFor="startDate">Дата начала</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={dateFormData.startDate}
            onChange={handleDateInputChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="endDate">Дата окончания</label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={dateFormData.endDate}
            onChange={handleDateInputChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="availability">Доступных мест</label>
          <input
            type="number"
            id="availability"
            name="availability"
            value={dateFormData.availability}
            onChange={handleDateInputChange}
            min="0"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="priceModifier">Модификатор цены</label>
          <input
            type="number"
            id="priceModifier"
            name="priceModifier"
            value={dateFormData.priceModifier}
            onChange={handleDateInputChange}
            min="0.1"
            step="0.1"
            required
          />
          <small>1.0 = базовая цена, 1.2 = +20% к цене, 0.9 = -10% от цены</small>
        </div>
        
        <div className="form-buttons">
          <button type="submit" className="admin-button save-button">
            {isCreatingDate ? 'Добавить дату' : 'Сохранить изменения'}
          </button>
          <button 
            type="button" 
            className="admin-button cancel-button"
            onClick={handleCancelDateEdit}
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
  
  // 5. Список дат тура
  const renderDatesList = () => {
    const tour = tours.find(t => t.id === currentTourId);
    
    // Проверка наличия текущего тура
    if (!currentTourId || !tour) {
      console.error('[AdminTours] Ошибка: не найден тур с ID', currentTourId);
      return (
        <div className="tour-dates-container">
          <div className="admin-header">
            <button
              className="admin-button back-button"
              onClick={handleBackToTours}
            >
              ← Назад к списку туров
            </button>
            <h2>Ошибка: тур не найден</h2>
          </div>
          <div className="admin-error">
            Не удалось загрузить информацию о туре. Пожалуйста, вернитесь к списку туров и попробуйте снова.
          </div>
        </div>
      );
    }

    // Проверяем, что selectedTourDates - это массив
    const validDates = Array.isArray(selectedTourDates) ? selectedTourDates : [];
    
    return (
      <div className="tour-dates-container">
        <div className="admin-header">
          <button
            className="admin-button back-button"
            onClick={handleBackToTours}
          >
            ← Назад к списку туров
          </button>
          <h2>Даты тура: {tour?.name || 'Выбранный тур'}</h2>
          <button
            className="admin-button add-button"
            onClick={handleAddDateClick}
          >
            Добавить дату
          </button>
        </div>
        
        {renderNotifications()}
        
        {isEditingDate ? (
          renderDateForm()
        ) : (
          <div className="dates-table-container">
            <table className="admin-table dates-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Дата начала</th>
                  <th>Дата окончания</th>
                  <th>Доступных мест</th>
                  <th>Модификатор цены</th>
                  <th>Итоговая цена</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="loading-cell">Загрузка дат тура...</td>
                  </tr>
                ) : (
                  validDates.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="empty-cell">
                        Даты для этого тура не найдены. Нажмите кнопку "Добавить дату", чтобы создать новую дату тура.
                      </td>
                    </tr>
                  ) : (
                    validDates.map(date => {
                      try {
                        const basePrice = tour?.basePrice || (tour as any)?.base_price || 0;
                        const startDate = getDateValue(date, 'startDate', 'start_date');
                        const endDate = getDateValue(date, 'endDate', 'end_date');
                        const priceModifier = getDateValue(date, 'priceModifier', 'price_modifier') || 1;
                        const finalPrice = basePrice * priceModifier;
                        
                        return (
                          <tr key={date.id}>
                            <td>{date.id}</td>
                            <td>{formatDate(startDate)}</td>
                            <td>{formatDate(endDate)}</td>
                            <td>{date.availability}</td>
                            <td>
                              {priceModifier === 1 
                                ? '1.0 (нет изменений)' 
                                : priceModifier > 1 
                                ? `${priceModifier.toFixed(1)} (+${((priceModifier - 1) * 100).toFixed(0)}%)` 
                                : `${priceModifier.toFixed(1)} (-${((1 - priceModifier) * 100).toFixed(0)}%)`}
                            </td>
                            <td>{finalPrice.toLocaleString('ru')} ₽</td>
                            <td className="actions-cell">
                              <button
                                className="table-button edit-button"
                                onClick={() => handleEditDateClick(date)}
                                title="Редактировать дату"
                              >
                                Редактировать
                              </button>
                              <button
                                className="table-button delete-button"
                                onClick={() => handleDeleteDate(date.id)}
                                title="Удалить дату"
                              >
                                Удалить
                              </button>
                            </td>
                          </tr>
                        );
                      } catch (err) {
                        console.error('[AdminTours] Ошибка отрисовки даты тура:', err, date);
                        return (
                          <tr key={date.id || 'error'}>
                            <td colSpan={7} className="error-cell">
                              Ошибка отображения даты тура ID: {date.id || 'неизвестно'}
                            </td>
                          </tr>
                        );
                      }
                    })
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };
  
  // Итоговый рендеринг компонента в зависимости от режима просмотра
  return (
    <div className="admin-tours-container">
      {viewMode === 'tours' && renderToursList()}
      {viewMode === 'edit' && renderTourForm()}
      {viewMode === 'dates' && renderDatesList()}
    </div>
  );
};

export default AdminTours; 