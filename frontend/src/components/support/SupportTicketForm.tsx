import React, { useState } from 'react';
import './SupportTicketForm.css';

interface SupportTicketFormProps {
  onSubmit: (subject: string, message: string) => void;
}

const SupportTicketForm: React.FC<SupportTicketFormProps> = ({ onSubmit }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!subject.trim()) {
      newErrors.subject = 'Тема обязательна';
    }
    
    if (!message.trim()) {
      newErrors.message = 'Сообщение обязательно';
    } else if (message.trim().length < 10) {
      newErrors.message = 'Сообщение должно содержать не менее 10 символов';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    onSubmit(subject, message);
    
    // Сбрасываем форму
    setSubject('');
    setMessage('');
    setErrors({});
  };
  
  return (
    <div className="support-ticket-form-container">
      <h3>Создать новый тикет</h3>
      <p className="form-description">
        Опишите вашу проблему или вопрос, и наша служба поддержки ответит вам в ближайшее время.
      </p>
      
      <form onSubmit={handleSubmit} className="support-ticket-form">
        <div className="form-group">
          <label htmlFor="subject">Тема</label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Кратко опишите тему вашего обращения"
          />
          {errors.subject && <span className="error-text">{errors.subject}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="message">Сообщение</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Подробно опишите вашу проблему или вопрос"
            rows={6}
          />
          {errors.message && <span className="error-text">{errors.message}</span>}
        </div>
        
        <button type="submit" className="create-ticket-button">
          Создать тикет
        </button>
      </form>
    </div>
  );
};

export default SupportTicketForm; 