import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Route, Routes } from 'react-router-dom';
// Здесь импортируем необходимые action creators из Redux
// import { fetchTours, createTour, updateTour, deleteTour } from '../../store/tours/toursSlice';

const AdminTours: React.FC = () => {
  const dispatch = useDispatch();
  const { tours, loading, error } = useSelector((state: any) => state.tours);
  const [selectedTour, setSelectedTour] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  useEffect(() => {
    // Загружаем список туров при монтировании компонента
    // dispatch(fetchTours({}) as any);
  }, [dispatch]);
  
  const handleAddTour = () => {
    setSelectedTour(null);
    setIsModalOpen(true);
  };
  
  const handleEditTour = (tour: any) => {
    setSelectedTour(tour);
    setIsModalOpen(true);
  };
  
  const handleDeleteTour = (tourId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот тур?')) {
      // Удаляем тур
      // dispatch(deleteTour(tourId) as any);
    }
  };
  
  const handleSaveTour = (tourData: any) => {
    // Если редактируем существующий тур
    if (selectedTour) {
      // dispatch(updateTour({ ...tourData, id: selectedTour.id }) as any);
    } else {
      // Создаем новый тур
      // dispatch(createTour(tourData) as any);
    }
    setIsModalOpen(false);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  return (
    <div className="admin-tours">
      <div className="admin-header">
        <h2>Управление турами</h2>
        <button className="admin-btn admin-btn-primary" onClick={handleAddTour}>
          Добавить тур
        </button>
      </div>
      
      {loading ? (
        <div className="admin-loading">Загрузка...</div>
      ) : error ? (
        <div className="admin-error">{error}</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Город</th>
                <th>Базовая цена</th>
                <th>Активен</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {tours && tours.map((tour: any) => (
                <tr key={tour.id}>
                  <td>{tour.id}</td>
                  <td>{tour.name}</td>
                  <td>{tour.city?.name}</td>
                  <td>{tour.basePrice}</td>
                  <td>{tour.isActive ? 'Да' : 'Нет'}</td>
                  <td className="admin-actions">
                    <button className="admin-btn admin-btn-sm" onClick={() => handleEditTour(tour)}>
                      Изменить
                    </button>
                    <button 
                      className="admin-btn admin-btn-sm admin-btn-danger" 
                      onClick={() => handleDeleteTour(tour.id)}
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
      
      {/* Здесь можно добавить модальное окно для редактирования/создания тура */}
      {isModalOpen && (
        <div className="admin-modal">
          <div className="admin-modal-content">
            <h3>{selectedTour ? 'Редактировать тур' : 'Добавить тур'}</h3>
            {/* Здесь форма для редактирования/создания тура */}
            <div className="admin-modal-footer">
              <button className="admin-btn" onClick={handleCloseModal}>Отмена</button>
              <button className="admin-btn admin-btn-primary" onClick={() => handleSaveTour({})}>
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTours; 