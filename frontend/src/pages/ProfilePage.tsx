import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { getUserProfile, updateUserProfile } from '../store/auth/authSlice';
import Spinner from '../components/ui/Spinner';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, loading, error, isAuthenticated } = useSelector((state: any) => state.auth);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/profile' } });
      return;
    }
    
    // Загружаем данные пользователя
    dispatch(getUserProfile());
  }, [dispatch, navigate, isAuthenticated]);
  
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : ''
      });
    }
  }, [user]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Очищаем ошибку при изменении поля
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'Введите имя';
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Введите фамилию';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Введите email';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Введите корректный email';
    }
    
    if (formData.phone && !/^\+?\d{10,15}$/.test(formData.phone)) {
      errors.phone = 'Введите корректный номер телефона';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Отправляем обновленные данные
      dispatch(updateUserProfile(formData));
      setIsEditing(false);
    }
  };
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleCancel = () => {
    // Сбрасываем форму к данным пользователя
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : ''
      });
    }
    setIsEditing(false);
    setFormErrors({});
  };
  
  if (loading) {
    return <Spinner />;
  }
  
  if (error) {
    return (
      <div className="profile-error">
        <h2>Ошибка загрузки профиля</h2>
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div className="profile-page">
      <h1>Личный кабинет</h1>
      
      <div className="profile-container">
        <div className="profile-sidebar">
          <div className="profile-menu">
            <button className="menu-item active">Профиль</button>
            <button className="menu-item" onClick={() => navigate('/orders')}>История заказов</button>
            <button className="menu-item" onClick={() => navigate('/support')}>Техподдержка</button>
          </div>
        </div>
        
        <div className="profile-content">
          <div className="profile-header">
            <h2>Личные данные</h2>
            {!isEditing && (
              <button className="edit-button" onClick={handleEdit}>
                Редактировать
              </button>
            )}
          </div>
          
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">Имя</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={formErrors.firstName ? 'error' : ''}
                />
                {formErrors.firstName && <div className="error-message">{formErrors.firstName}</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="lastName">Фамилия</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={formErrors.lastName ? 'error' : ''}
                />
                {formErrors.lastName && <div className="error-message">{formErrors.lastName}</div>}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                className={formErrors.email ? 'error' : ''}
              />
              {formErrors.email && <div className="error-message">{formErrors.email}</div>}
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Телефон</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={formErrors.phone ? 'error' : ''}
                />
                {formErrors.phone && <div className="error-message">{formErrors.phone}</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="birthDate">Дата рождения</label>
                <input
                  type="date"
                  id="birthDate"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </div>
            
            {isEditing && (
              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={handleCancel}>
                  Отмена
                </button>
                <button type="submit" className="save-button">
                  Сохранить
                </button>
              </div>
            )}
          </form>
          
          <div className="password-change-section">
            <h3>Изменение пароля</h3>
            <button className="change-password-button" onClick={() => navigate('/change-password')}>
              Изменить пароль
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 