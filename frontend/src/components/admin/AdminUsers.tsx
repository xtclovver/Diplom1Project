import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const AdminUsers: React.FC = () => {
  const dispatch = useDispatch();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  useEffect(() => {
    // Загрузка пользователей при монтировании компонента
    // Здесь должен быть запрос к API
    setLoading(true);
    
    // Имитация загрузки данных
    setTimeout(() => {
      setUsers([
        { 
          id: 1, 
          username: 'user1', 
          email: 'user1@example.com',
          fullName: 'Иванов Иван',
          phone: '+7 (999) 123-45-67',
          role: { id: 2, name: 'user' },
          createdAt: '2023-03-15'
        },
        { 
          id: 2, 
          username: 'admin1', 
          email: 'admin@example.com',
          fullName: 'Администратор Главный',
          phone: '+7 (999) 987-65-43',
          role: { id: 1, name: 'admin' },
          createdAt: '2023-02-10'
        },
        { 
          id: 3, 
          username: 'support1', 
          email: 'support@example.com',
          fullName: 'Поддержкин Саппорт',
          phone: '+7 (999) 555-55-55',
          role: { id: 3, name: 'support' },
          createdAt: '2023-04-01'
        },
      ]);
      setLoading(false);
    }, 800);
  }, []);
  
  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };
  
  const handleSaveUser = (userData: any) => {
    // Обновление роли пользователя
    // dispatch(updateUserRole({ userId: selectedUser.id, role: userData.role }));
    setUsers(users.map(user => 
      user.id === selectedUser.id ? { ...user, role: { id: userData.roleId, name: userData.roleName } } : user
    ));
    setIsModalOpen(false);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };
  
  const getRoleName = (roleName: string) => {
    switch (roleName) {
      case 'admin':
        return 'Администратор';
      case 'user':
        return 'Пользователь';
      case 'support':
        return 'Тех-поддержка';
      default:
        return roleName;
    }
  };
  
  return (
    <div className="admin-users">
      <div className="admin-header">
        <h2>Управление пользователями</h2>
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
                <th>Имя пользователя</th>
                <th>Email</th>
                <th>ФИО</th>
                <th>Телефон</th>
                <th>Роль</th>
                <th>Дата регистрации</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.fullName}</td>
                  <td>{user.phone}</td>
                  <td>
                    <span className={`role-badge role-${user.role.name}`}>
                      {getRoleName(user.role.name)}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td className="admin-actions">
                    <button 
                      className="admin-btn admin-btn-sm"
                      onClick={() => handleEditUser(user)}
                    >
                      Изменить роль
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Модальное окно для редактирования пользователя */}
      {isModalOpen && selectedUser && (
        <div className="admin-modal">
          <div className="admin-modal-content">
            <h3>Изменить роль пользователя</h3>
            <p>Пользователь: {selectedUser.username}</p>
            <div className="admin-form-group">
              <label>Роль:</label>
              <select 
                defaultValue={selectedUser.role.id}
                onChange={(e) => setSelectedUser({
                  ...selectedUser,
                  role: { ...selectedUser.role, id: e.target.value }
                })}
              >
                <option value="1">Администратор</option>
                <option value="2">Пользователь</option>
                <option value="3">Тех-поддержка</option>
              </select>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn" onClick={handleCloseModal}>Отмена</button>
              <button 
                className="admin-btn admin-btn-primary" 
                onClick={() => handleSaveUser({ 
                  roleId: selectedUser.role.id,
                  roleName: selectedUser.role.id === "1" ? "admin" : 
                           selectedUser.role.id === "2" ? "user" : "support"
                })}
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

export default AdminUsers; 