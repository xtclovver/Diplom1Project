import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  fetchUserTickets, 
  createTicket, 
  closeTicket,
  sendMessage 
} from '../store/support/supportSlice';
import SupportTicketList from '../components/support/SupportTicketList';
import SupportTicketChat from '../components/support/SupportTicketChat';
import SupportTicketForm from '../components/support/SupportTicketForm';
import './SupportPage.css';

const SupportPage: React.FC = () => {
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [dataInitialized, setDataInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('tickets');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Используем безопасное получение данных из store
  const supportState = useSelector((state: any) => state?.support);
  const loading = supportState?.loading || false;
  const error = supportState?.error || null;
  const { isAuthenticated, user } = useSelector((state: any) => state?.auth || { isAuthenticated: false, user: null });
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Если пользователь - администратор, перенаправляем на админ-страницу
    if (user && (user.roleId === 1 || user.role === 'admin')) {
      navigate('/admin/support');
      return;
    }
    
    // Загружаем тикеты пользователя
    dispatch(fetchUserTickets() as any)
      .then(() => {
        setDataInitialized(true);
      })
      .catch((err: any) => {
        console.error('Ошибка при загрузке тикетов:', err);
        setDataInitialized(true); // Помечаем как инициализированные даже в случае ошибки
      });
  }, [dispatch, isAuthenticated, navigate, user]);
  
  const handleTicketSelect = (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setShowNewTicketForm(false);
  };
  
  const handleCreateTicket = (subject: string, message: string) => {
    dispatch(createTicket({ subject, message }) as any)
      .then(() => {
        setShowNewTicketForm(false);
      });
  };
  
  const handleCloseTicket = (ticketId: number) => {
    dispatch(closeTicket(ticketId) as any)
      .then(() => {
        setSelectedTicketId(null);
      });
  };
  
  const handleSendMessage = (ticketId: number, message: string) => {
    dispatch(sendMessage({ ticketId, message }) as any);
  };
  
  const handleNewTicketClick = () => {
    setShowNewTicketForm(true);
    setSelectedTicketId(null);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'tickets') {
      setShowNewTicketForm(false);
    } else if (tab === 'new') {
      setShowNewTicketForm(true);
      setSelectedTicketId(null);
    }
  };

  // Показываем индикатор загрузки пока данные не загружены
  if (loading || !dataInitialized) {
    return <div className="support-loading">Загрузка...</div>;
  }

  if (error) {
    return <div className="support-error">Ошибка: {error}</div>;
  }

  return (
    <div className="support-page">
      <div className="support-hero">
        <div className="container">
          <h1>Личный кабинет</h1>
          <p className="support-subtitle">Ваш профиль и история бронирований</p>
        </div>
      </div>
      
      <div className="support-container">
        <div className="support-sidebar">
          <div className="support-menu">
            <button 
              className="menu-item"
              onClick={() => navigate('/profile')}
            >
              Профиль
            </button>
            <button 
              className="menu-item"
              onClick={() => navigate('/orders')}
            >
              История заказов
            </button>
            <button 
              className="menu-item active"
            >
              Техподдержка
            </button>
            <button 
              className={`submenu-item ${activeTab === 'tickets' ? 'active' : ''}`}
              onClick={() => handleTabChange('tickets')}
            >
              Мои тикеты
            </button>
            <button 
              className={`submenu-item ${activeTab === 'new' ? 'active' : ''}`}
              onClick={() => handleTabChange('new')}
            >
              Создать тикет
            </button>
          </div>
        </div>
        
        <div className="support-content">
          {activeTab === 'tickets' && (
            <>
              <div className="support-header">
                <h2>Мои обращения</h2>
                <button 
                  className="new-ticket-button" 
                  onClick={() => handleTabChange('new')}
                >
                  Новый тикет
                </button>
              </div>
              
              <div className="support-tickets-container">
                <div className="tickets-list-container">
                  <SupportTicketList 
                    selectedTicketId={selectedTicketId}
                    onTicketSelect={handleTicketSelect}
                  />
                </div>
                
                <div className="ticket-details-container">
                  {selectedTicketId ? (
                    <SupportTicketChat 
                      ticketId={selectedTicketId} 
                      onSendMessage={handleSendMessage}
                      onCloseTicket={handleCloseTicket}
                    />
                  ) : (
                    <div className="support-empty-state">
                      <h3>Выберите тикет из списка</h3>
                      <p>
                        Здесь вы можете просмотреть историю общения по выбранному обращению
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          
          {activeTab === 'new' && (
            <>
              <div className="support-header">
                <h2>Новое обращение</h2>
              </div>
              <SupportTicketForm onSubmit={handleCreateTicket} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportPage; 