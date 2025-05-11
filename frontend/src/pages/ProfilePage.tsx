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
  const authState = useSelector((state: any) => state.auth);
  const { user, loading, error, isAuthenticated } = authState;
  
  // Отладочное логирование состояния аутентификации
  useEffect(() => {
    console.log('[ProfilePage] Состояние аутентификации:', {
      isAuthenticated: authState.isAuthenticated,
      hasUser: !!authState.user,
      hasToken: !!authState.token,
      loading: authState.loading,
      error: authState.error
    });
    
    if (authState.user) {
      console.log('[ProfilePage] Данные пользователя:', JSON.stringify(authState.user, null, 2));
    }
  }, [authState]);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    birthDate: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Проверка, является ли пользователь администратором
  const isUserAdmin = (): boolean => {
    if (!user) return false;
    
    // Проверяем разные варианты структуры объекта пользователя
    if (user.role && user.role.name === 'admin') return true;
    if (user.role && user.role.name === 'админ') return true;
    if (user.roleId === 1) return true;
    if (user.username === 'admin') return true;
    if (user.role === 'admin') return true;
    
    // Если в консоли видим, что пользователь - админ, но выше проверки не проходят,
    // добавьте вывод объекта user в консоль и дополните условия
    console.log('[ProfilePage] Проверка администратора:', user);
    
    return false;
  };
  
  useEffect(() => {
    console.log('[ProfilePage] Проверка аутентификации:', isAuthenticated);
    if (!isAuthenticated) {
      console.log('[ProfilePage] Перенаправление на страницу входа');
      navigate('/login', { state: { from: '/profile' } });
      return;
    }
    
    // Загружаем данные пользователя только если их еще нет
    if (!user && !loading) {
      console.log('[ProfilePage] Отсутствуют данные пользователя, запрашиваем их');
      dispatch(getUserProfile());
    } else {
      console.log('[ProfilePage] Данные пользователя уже загружены или загружаются:', 
        user ? 'данные есть' : 'загрузка в процессе');
    }
  }, [dispatch, navigate, isAuthenticated, user, loading]);
  
  useEffect(() => {
    console.log('[ProfilePage] Обновление данных пользователя в форме:', user);
    if (user) {
      try {
        // Формируем полное имя
        let fullName = user.fullName || '';
        
        if (!fullName) {
          if (user.first_name || user.firstName) {
            // Получаем имя и фамилию из соответствующих полей (в зависимости от формата данных)
            const firstName = user.first_name || user.firstName || '';
            const lastName = user.last_name || user.lastName || '';
            fullName = `${firstName} ${lastName}`.trim();
            console.log('[ProfilePage] Сформировано полное имя из first_name и last_name:', fullName);
          }
        }
        
        // Получаем email, phone и birthDate из соответствующих полей (в зависимости от формата данных)
        const email = user.email || '';
        const phone = user.phone || '';
        const birthDate = user.birth_date || user.birthDate || '';
        
        console.log('[ProfilePage] Данные для формы:', {
          fullName,
          email,
          phone,
          birthDate
        });
        
        // Создаем объект с безопасным доступом к полям
        setFormData({
          fullName: fullName,
          email: email,
          phone: phone,
          birthDate: birthDate ? (birthDate.includes('T') ? birthDate.split('T')[0] : birthDate) : ''
        });
      } catch (err) {
        console.error('[ProfilePage] Ошибка при обработке данных пользователя:', err);
      }
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
    
    if (!formData.fullName.trim()) {
      errors.fullName = 'Введите полное имя';
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
    console.log('[ProfilePage] Отправка формы');
    
    if (validateForm()) {
      console.log('[ProfilePage] Форма прошла валидацию');
      // Извлекаем имя и фамилию из полного имени (для API)
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const profileData = {
        firstName,
        lastName,
        email: formData.email,
        phone: formData.phone,
        birthDate: formData.birthDate
      };
      
      console.log('[ProfilePage] Данные для обновления профиля:', profileData);
      
      // Отправляем обновленные данные через редьюсер
      dispatch(updateUserProfile(profileData))
        .unwrap()
        .then((result) => {
          console.log('[ProfilePage] Профиль успешно обновлен:', result);
          // Показываем уведомление об успешном обновлении
          alert('Профиль успешно обновлен!');
          setIsEditing(false);
        })
        .catch((error) => {
          console.error('[ProfilePage] Ошибка обновления профиля:', error);
          // Показываем уведомление об ошибке
          alert(`Ошибка обновления профиля: ${error}`);
        });
    } else {
      console.error('[ProfilePage] Форма не прошла валидацию');
    }
  };
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleCancel = () => {
    // Сбрасываем форму к данным пользователя
    if (user) {
      setFormData({
        fullName: user.fullName || '',
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
      <div className="profile-hero">
        <div className="container">
          <h1>Личный кабинет</h1>
          <p className="profile-subtitle">Ваш профиль и история бронирований</p>
        </div>
      </div>
      
      <div className="profile-container">
        <div className="profile-sidebar">
          <div className="profile-menu">
            <button className="menu-item active">Профиль</button>
            <button className="menu-item" onClick={() => navigate('/orders')}>История заказов</button>
            <button className="menu-item" onClick={() => navigate('/support')}>Техподдержка</button>
            
            {/* Добавляем раздел Администрирование для администраторов с улучшенной проверкой */}
            {isUserAdmin() && (
              <div className="menu-group">
                <div className="menu-group-title">Администрирование</div>
                <div className="menu-group-items">
                  <button 
                    className="menu-item submenu-item" 
                    onClick={() => navigate('/admin/tours')}
                  >
                    Управление турами
                  </button>
                </div>
              </div>
            )}
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
            <div className="form-group">
              <label htmlFor="username">Логин</label>
              <input
                type="text"
                id="username"
                name="username"
                value={user?.username || ''}
                disabled={true}
                className="readonly-field"
              />
              <small className="field-hint">Логин не может быть изменен</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="fullName">Полное имя</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                disabled={!isEditing}
                className={formErrors.fullName ? 'error' : ''}
              />
              {formErrors.fullName && <div className="error-message">{formErrors.fullName}</div>}
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