import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const AdminHotels: React.FC = () => {
  const dispatch = useDispatch();
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  useEffect(() => {
    // Загрузка отелей при монтировании компонента
    // Здесь должен быть запрос к API
    setLoading(true);
    
    // Имитация загрузки данных
    setTimeout(() => {
      setHotels([
        { id: 1, name: 'Отель Приморский', city: { id: 1, name: 'Сочи' }, category: 5, address: 'ул. Приморская, 15' },
        { id: 2, name: 'Горный курорт', city: { id: 2, name: 'Красная Поляна' }, category: 4, address: 'ул. Горная, 42' },
      ]);
      setLoading(false);
    }, 800);
  }, []);
  
  const handleAddHotel = () => {
    setSelectedHotel(null);
    setIsModalOpen(true);
  };
  
  const handleEditHotel = (hotel: any) => {
    setSelectedHotel(hotel);
    setIsModalOpen(true);
  };
  
  const handleDeleteHotel = (hotelId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот отель?')) {
      // Удаление отеля
      // dispatch(deleteHotel(hotelId));
      setHotels(hotels.filter(hotel => hotel.id !== hotelId));
    }
  };
  
  const handleSaveHotel = (hotelData: any) => {
    if (selectedHotel) {
      // Обновление существующего отеля
      // dispatch(updateHotel({ ...hotelData, id: selectedHotel.id }));
      setHotels(hotels.map(hotel => 
        hotel.id === selectedHotel.id ? { ...hotel, ...hotelData } : hotel
      ));
    } else {
      // Создание нового отеля
      // dispatch(createHotel(hotelData));
      const newHotel = { 
        id: hotels.length ? Math.max(...hotels.map(h => h.id)) + 1 : 1,
        ...hotelData
      };
      setHotels([...hotels, newHotel]);
    }
    setIsModalOpen(false);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  return (
    <div className="admin-hotels">
      <div className="admin-header">
        <h2>Управление отелями</h2>
        <button className="admin-btn admin-btn-primary" onClick={handleAddHotel}>
          Добавить отель
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
                <th>Категория</th>
                <th>Адрес</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {hotels.map(hotel => (
                <tr key={hotel.id}>
                  <td>{hotel.id}</td>
                  <td>{hotel.name}</td>
                  <td>{hotel.city?.name}</td>
                  <td>{"⭐".repeat(hotel.category)}</td>
                  <td>{hotel.address}</td>
                  <td className="admin-actions">
                    <button 
                      className="admin-btn admin-btn-sm"
                      onClick={() => handleEditHotel(hotel)}
                    >
                      Изменить
                    </button>
                    <button 
                      className="admin-btn admin-btn-sm admin-btn-danger"
                      onClick={() => handleDeleteHotel(hotel.id)}
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
      
      {/* Модальное окно для редактирования/создания отеля */}
      {isModalOpen && (
        <div className="admin-modal">
          <div className="admin-modal-content">
            <h3>{selectedHotel ? 'Редактировать отель' : 'Добавить отель'}</h3>
            {/* Форма для редактирования/создания отеля */}
            <div className="admin-modal-footer">
              <button className="admin-btn" onClick={handleCloseModal}>Отмена</button>
              <button 
                className="admin-btn admin-btn-primary" 
                onClick={() => handleSaveHotel({})}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHotels; 