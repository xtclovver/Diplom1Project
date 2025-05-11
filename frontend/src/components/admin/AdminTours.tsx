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
    dispatch(fetchTours() as any);
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
      imageUrl: tour.imageUrl,
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
    setCurrentTourId(tourId);
    setViewMode('dates');
    dispatch(fetchTourDates(tourId) as any)
      .then((action: any) => {
        if (action.payload) {
          setSelectedTourDates(action.payload);
        }
      });
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
    setDateFormData({
      startDate: date.startDate,
      endDate: date.endDate,
      availability: date.availability,
      priceModifier: date.priceModifier
    });
  };
  
  const handleSaveDate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentTourId) return;
    
    const dateData = {
      ...dateFormData,
      tourId: currentTourId
    };
    
    if (isCreatingDate) {
      dispatch(addTourDate(dateData) as any);
    } else {
      dispatch(updateTourDate({ ...dateData, id: currentDateId } as any) as any);
    }
    
    setIsEditingDate(false);
  };
  
  const handleDeleteDate = (dateId: number) => {
    if (!currentTourId || !window.confirm('Вы уверены, что хотите удалить эту дату?')) return;
    
    dispatch(deleteTourDate({ tourId: currentTourId, dateId }) as any);
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
          <input
            type="text"
            id="imageUrl"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleInputChange}
          />
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
                <td colSpan={7} className="loading-cell">Загрузка...</td>
              </tr>
            ) : filteredTours.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-cell">
                  {searchQuery ? 'Туры не найдены' : 'Список туров пуст'}
                </td>
              </tr>
            ) : (
              filteredTours.map(tour => (
                <tr key={tour.id} className={tour.isActive ? 'active-row' : 'inactive-row'}>
                  <td>{tour.id}</td>
                  <td>{tour.name}</td>
                  <td>{tour.city?.name || getCityName(tour.cityId)}</td>
                  <td>{tour.basePrice?.toLocaleString('ru') || (tour as any).base_price?.toLocaleString('ru')} ₽</td>
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
                    <td colSpan={7} className="loading-cell">Загрузка...</td>
                  </tr>
                ) : selectedTourDates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-cell">Даты для этого тура не найдены</td>
                  </tr>
                ) : (
                  selectedTourDates.map(date => {
                    const tour = tours.find(t => t.id === currentTourId);
                    const basePrice = tour?.basePrice || (tour as any)?.base_price || 0;
                    const finalPrice = basePrice * date.priceModifier;
                    
                    return (
                      <tr key={date.id}>
                        <td>{date.id}</td>
                        <td>{new Date(date.startDate).toLocaleDateString('ru')}</td>
                        <td>{new Date(date.endDate).toLocaleDateString('ru')}</td>
                        <td>{date.availability}</td>
                        <td>
                          {date.priceModifier === 1 
                            ? '1.0 (нет изменений)' 
                            : date.priceModifier > 1 
                            ? `${date.priceModifier.toFixed(1)} (+${((date.priceModifier - 1) * 100).toFixed(0)}%)` 
                            : `${date.priceModifier.toFixed(1)} (-${((1 - date.priceModifier) * 100).toFixed(0)}%)`}
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
                  })
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