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

// Компонент для управления турами в админ-панели
const AdminTours: React.FC = () => {
  const dispatch = useDispatch();
  const { tours, selectedTour, loading, error, success } = useSelector((state: RootState) => state.adminTours);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: 0,
    cityId: 0,
    imageUrl: '',
    duration: 0,
    isActive: true
  });
  const [dateFormData, setDateFormData] = useState({
    startDate: '',
    endDate: '',
    availability: 30,
    priceModifier: 1.0
  });
  const [cities, setCities] = useState<any[]>([]);
  const [citiesError, setCitiesError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'tours' | 'dates'>('tours');
  const [currentTourId, setCurrentTourId] = useState<number | null>(null);
  const [selectedTourDates, setSelectedTourDates] = useState<any[]>([]);
  const [selectedDateId, setSelectedDateId] = useState<number | null>(null);

  // Загружаем список туров при монтировании компонента
  useEffect(() => {
    console.log('[AdminTours] Загрузка списка туров');
    try {
      dispatch(fetchTours() as any)
        .then((action: any) => {
          if (action.type === fetchTours.fulfilled.type) {
            console.log('[AdminTours] Туры успешно загружены:', action.payload?.length || 0, 'туров');
          } else {
            console.error('[AdminTours] Ошибка при загрузке туров:', action.error?.message);
          }
        })
        .catch((error: any) => {
          console.error('[AdminTours] Ошибка при загрузке туров:', error);
        });
    } catch (error) {
      console.error('[AdminTours] Критическая ошибка при вызове fetchTours:', error);
    }
    
    // Загружаем список городов
    fetchCities();
  }, [dispatch]);

  // Если выбран тур и режим просмотра - даты, загружаем данные о датах тура
  useEffect(() => {
    if (currentTourId && viewMode === 'dates') {
      dispatch(fetchTourDates(currentTourId) as any)
        .then((action: any) => {
          if (action.payload) {
            setSelectedTourDates(action.payload);
          }
        })
        .catch((error: any) => {
          console.error('[AdminTours] Ошибка при загрузке дат тура:', error);
        });
    }
  }, [currentTourId, viewMode, dispatch]);

  // Загрузка списка городов
  const fetchCities = async () => {
    try {
      console.log('[AdminTours] Загрузка списка городов');
      setCitiesError(null);
      const response = await fetch('/api/cities');
      
      // Проверка успешного ответа
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Проверка данных и адаптация к формату ответа с data и total
      if (data && Array.isArray(data.data)) {
        console.log('[AdminTours] Города успешно загружены:', data.data.length);
        setCities(data.data);
      } else {
        console.error('[AdminTours] Данные городов не являются массивом или отсутствует поле data:', data);
        setCitiesError('Получен некорректный формат данных городов');
        setCities([]);
      }
    } catch (error) {
      console.error('[AdminTours] Ошибка при загрузке списка городов:', error);
      setCitiesError(error instanceof Error ? error.message : 'Ошибка при загрузке списка городов');
      setCities([]);
    }
  };

  // Обработчик закрытия сообщений об ошибках и успешных операциях
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        dispatch(clearError());
        dispatch(clearSuccess());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success, dispatch]);

  // Обработчик закрытия сообщения об ошибке загрузки городов
  useEffect(() => {
    if (citiesError) {
      const timer = setTimeout(() => {
        setCitiesError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [citiesError]);

  // Обработчик открытия модального окна для создания нового тура
  const handleAddTour = () => {
    dispatch(setSelectedTour(null));
    setFormData({
      name: '',
      description: '',
      basePrice: 0,
      cityId: 0,
      imageUrl: '',
      duration: 0,
      isActive: true
    });
    setIsModalOpen(true);
  };

  // Обработчик открытия модального окна для редактирования тура
  const handleEditTour = (tour: any) => {
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
    setIsModalOpen(true);
  };

  // Обработчик удаления тура
  const handleDeleteTour = (tourId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот тур?')) {
      dispatch(deleteTour(tourId) as any);
    }
  };

  // Обработчик изменения полей формы тура
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               type === 'number' ? parseFloat(value) : value
    }));
  };

  // Обработчик изменения полей формы даты тура
  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setDateFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  // Обработчик сохранения тура
  const handleSaveTour = (e: React.FormEvent) => {
    e.preventDefault();
    const tourData = selectedTour
      ? { ...formData, id: selectedTour.id }
      : formData;

    if (selectedTour) {
      dispatch(updateTour(tourData) as any);
    } else {
      dispatch(createTour(tourData) as any);
    }
    setIsModalOpen(false);
  };

  // Обработчик открытия модального окна для добавления даты тура
  const handleAddDate = (tourId: number) => {
    setCurrentTourId(tourId);
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() + 7); // По умолчанию начало через неделю
    
    const endDate = new Date(startDate);
    // Находим продолжительность тура
    const tour = tours.find(t => t.id === tourId);
    const duration = tour ? tour.duration : 7;
    endDate.setDate(endDate.getDate() + duration); // Продолжительность тура по умолчанию
    
    setDateFormData({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      availability: 30,
      priceModifier: 1.0
    });
    setSelectedDateId(null);
    setIsDateModalOpen(true);
  };

  // Обработчик открытия модального окна для редактирования даты тура
  const handleEditDate = (date: any) => {
    setCurrentTourId(date.tourId);
    setSelectedDateId(date.id);
    setDateFormData({
      startDate: new Date(date.startDate).toISOString().split('T')[0],
      endDate: new Date(date.endDate).toISOString().split('T')[0],
      availability: date.availability,
      priceModifier: date.priceModifier
    });
    setIsDateModalOpen(true);
  };

  // Обработчик удаления даты тура
  const handleDeleteDate = (tourId: number, dateId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту дату тура?')) {
      dispatch(deleteTourDate({ tourId, dateId }) as any);
    }
  };

  // Обработчик сохранения даты тура
  const handleSaveDate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentTourId) return;
    
    const tourDateData = {
      ...dateFormData,
      tourId: currentTourId
    };
    
    if (selectedDateId) {
      // Обновление существующей даты
      dispatch(updateTourDate({ ...tourDateData, id: selectedDateId }) as any);
    } else {
      // Добавление новой даты
      dispatch(addTourDate(tourDateData) as any);
    }
    setIsDateModalOpen(false);
  };

  // Обработчик переключения между представлениями (туры / даты тура)
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

  // Обработчик возврата к списку туров
  const handleBackToTours = () => {
    setViewMode('tours');
    setCurrentTourId(null);
  };

  // Фильтрация туров по поисковому запросу
  const filteredTours = tours.filter(tour => {
    return searchQuery === '' || 
           tour.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (tour.city?.name && tour.city.name.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  return (
    <div className="admin-tours">
      {error && <div className="admin-alert admin-alert-error">{error}</div>}
      {success && <div className="admin-alert admin-alert-success">{success}</div>}
      {citiesError && <div className="admin-alert admin-alert-error">Ошибка загрузки городов: {citiesError}</div>}

      {viewMode === 'tours' ? (
        <>
          <div className="admin-header">
            <h2>Управление турами</h2>
            <div className="admin-actions">
              <div className="admin-search">
                <input 
                  type="text" 
                  placeholder="Поиск тура..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="admin-btn admin-btn-primary" onClick={handleAddTour}>
                Добавить тур
              </button>
            </div>
          </div>

          {loading ? (
            <div className="admin-loading">Загрузка...</div>
          ) : tours.length === 0 ? (
            <div className="admin-empty">
              <p>Нет доступных туров. Создайте первый тур, нажав на кнопку "Добавить тур".</p>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Название</th>
                    <th>Город</th>
                    <th>Базовая цена</th>
                    <th>Продолжительность</th>
                    <th>Активен</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTours.map((tour) => (
                    <tr key={tour.id}>
                      <td>{tour.id}</td>
                      <td>{tour.name}</td>
                      <td>{tour.city?.name || 'Не указан'}</td>
                      <td>{tour.basePrice.toLocaleString()} ₽</td>
                      <td>{tour.duration} дн.</td>
                      <td>{tour.isActive ? 'Да' : 'Нет'}</td>
                      <td className="admin-actions">
                        <button
                          className="admin-btn admin-btn-sm"
                          onClick={() => handleViewTourDates(tour.id!)}
                          title="Даты тура"
                        >
                          Даты
                        </button>
                        <button
                          className="admin-btn admin-btn-sm"
                          onClick={() => handleEditTour(tour)}
                          title="Редактировать тур"
                        >
                          Изменить
                        </button>
                        <button
                          className="admin-btn admin-btn-sm admin-btn-danger"
                          onClick={() => handleDeleteTour(tour.id!)}
                          title="Удалить тур"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        // Режим просмотра и редактирования дат тура
        <>
          <div className="admin-header">
            <h2>
              <button className="admin-btn admin-btn-back" onClick={handleBackToTours}>
                &larr; Назад
              </button>
              Даты тура: {tours.find(tour => tour.id === currentTourId)?.name}
            </h2>
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => handleAddDate(currentTourId!)}
            >
              Добавить дату
            </button>
          </div>

          {loading ? (
            <div className="admin-loading">Загрузка...</div>
          ) : selectedTourDates.length === 0 ? (
            <div className="admin-empty">
              <p>У этого тура пока нет запланированных дат. Добавьте первую дату, нажав на кнопку "Добавить дату".</p>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Дата начала</th>
                    <th>Дата окончания</th>
                    <th>Доступно мест</th>
                    <th>Модификатор цены</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTourDates.map((date) => (
                    <tr key={date.id}>
                      <td>{date.id}</td>
                      <td>{new Date(date.startDate).toLocaleDateString()}</td>
                      <td>{new Date(date.endDate).toLocaleDateString()}</td>
                      <td>{date.availability}</td>
                      <td>×{date.priceModifier.toFixed(2)}</td>
                      <td className="admin-actions">
                        <button
                          className="admin-btn admin-btn-sm"
                          onClick={() => handleEditDate(date)}
                        >
                          Изменить
                        </button>
                        <button
                          className="admin-btn admin-btn-sm admin-btn-danger"
                          onClick={() => handleDeleteDate(currentTourId!, date.id)}
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Модальное окно для редактирования/создания тура */}
      {isModalOpen && (
        <div className="admin-modal">
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h3>{selectedTour ? 'Редактировать тур' : 'Добавить тур'}</h3>
              <button className="admin-modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSaveTour}>
              <div className="admin-form-group">
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
              
              <div className="admin-form-group">
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
              
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label htmlFor="basePrice">Базовая цена (₽)</label>
                  <input
                    type="number"
                    id="basePrice"
                    name="basePrice"
                    value={formData.basePrice}
                    onChange={handleInputChange}
                    min="0"
                    step="1000"
                    required
                  />
                </div>
                
                <div className="admin-form-group">
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
                        {city.name} {city.country?.name ? `(${city.country.name})` : ''}
                      </option>
                    ))}
                  </select>
                  {citiesError && <div className="admin-form-error">Ошибка при загрузке списка городов</div>}
                </div>
              </div>
              
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label htmlFor="imageUrl">URL изображения</label>
                  <input
                    type="text"
                    id="imageUrl"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="admin-form-group">
                  <label htmlFor="duration">Продолжительность (дни)</label>
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
              </div>
              
              <div className="admin-form-group admin-form-checkbox">
                <label>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  Активен
                </label>
              </div>
              
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn" onClick={() => setIsModalOpen(false)}>
                  Отмена
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  {selectedTour ? 'Сохранить изменения' : 'Создать тур'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно для редактирования/создания даты тура */}
      {isDateModalOpen && (
        <div className="admin-modal">
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h3>{selectedDateId ? 'Редактировать дату тура' : 'Добавить дату тура'}</h3>
              <button className="admin-modal-close" onClick={() => setIsDateModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSaveDate}>
              <div className="admin-form-row">
                <div className="admin-form-group">
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
                
                <div className="admin-form-group">
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
              </div>
              
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label htmlFor="availability">Количество мест</label>
                  <input
                    type="number"
                    id="availability"
                    name="availability"
                    value={dateFormData.availability}
                    onChange={handleDateInputChange}
                    min="1"
                    required
                  />
                </div>
                
                <div className="admin-form-group">
                  <label htmlFor="priceModifier">Модификатор цены</label>
                  <input
                    type="number"
                    id="priceModifier"
                    name="priceModifier"
                    value={dateFormData.priceModifier}
                    onChange={handleDateInputChange}
                    min="0.1"
                    max="5.0"
                    step="0.1"
                    required
                  />
                </div>
              </div>
              
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn" onClick={() => setIsDateModalOpen(false)}>
                  Отмена
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  {selectedDateId ? 'Сохранить изменения' : 'Добавить дату'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTours; 