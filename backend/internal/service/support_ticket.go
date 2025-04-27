package service

import (
	"context"
	"time"

	"github.com/usedcvnt/Diplom1Project/backend/internal/domain"
	"github.com/usedcvnt/Diplom1Project/backend/internal/repository"
)

// SupportTicketServiceImpl реализация сервиса для работы с тикетами поддержки
type SupportTicketServiceImpl struct {
	ticketRepo repository.SupportTicketRepository
	userRepo   repository.UserRepository
}

// NewSupportTicketService создает новый сервис для работы с тикетами поддержки
func NewSupportTicketService(ticketRepo repository.SupportTicketRepository, userRepo repository.UserRepository) SupportTicketService {
	return &SupportTicketServiceImpl{
		ticketRepo: ticketRepo,
		userRepo:   userRepo,
	}
}

// Create создает новый тикет поддержки
func (s *SupportTicketServiceImpl) Create(ctx context.Context, userID int64, subject, message string) (int64, error) {
	// Проверка существования пользователя
	_, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return 0, err
	}

	ticket := &domain.SupportTicket{
		UserID:    userID,
		Subject:   subject,
		Status:    "open",
		CreatedAt: time.Now(),
	}

	ticketID, err := s.ticketRepo.Create(ctx, ticket)
	if err != nil {
		return 0, err
	}

	// Добавляем первое сообщение в тикет
	_, err = s.AddMessage(ctx, ticketID, userID, message)
	if err != nil {
		return 0, err
	}

	return ticketID, nil
}

// GetByID получает тикет по ID
func (s *SupportTicketServiceImpl) GetByID(ctx context.Context, id int64) (*domain.SupportTicket, error) {
	return s.ticketRepo.GetByID(ctx, id)
}

// Update обновляет данные тикета
func (s *SupportTicketServiceImpl) Update(ctx context.Context, ticket *domain.SupportTicket) error {
	return s.ticketRepo.Update(ctx, ticket)
}

// Delete удаляет тикет
func (s *SupportTicketServiceImpl) Delete(ctx context.Context, id int64) error {
	return s.ticketRepo.Delete(ctx, id)
}

// ListByUserID возвращает список тикетов пользователя
func (s *SupportTicketServiceImpl) ListByUserID(ctx context.Context, userID int64) ([]*domain.SupportTicket, error) {
	return s.ticketRepo.ListByUserID(ctx, userID)
}

// List возвращает список тикетов с фильтрацией
func (s *SupportTicketServiceImpl) List(ctx context.Context, filters map[string]interface{}, page, size int) ([]*domain.SupportTicket, int, error) {
	tickets, err := s.ticketRepo.List(ctx, filters, page, size)
	if err != nil {
		return nil, 0, err
	}

	totalCount, err := s.ticketRepo.Count(ctx, filters)
	if err != nil {
		return nil, 0, err
	}

	return tickets, totalCount, nil
}

// UpdateStatus обновляет статус тикета
func (s *SupportTicketServiceImpl) UpdateStatus(ctx context.Context, id int64, status string) error {
	return s.ticketRepo.UpdateStatus(ctx, id, status)
}

// AddMessage добавляет сообщение в тикет
func (s *SupportTicketServiceImpl) AddMessage(ctx context.Context, ticketID, userID int64, message string) (int64, error) {
	// Проверка существования тикета
	_, err := s.ticketRepo.GetByID(ctx, ticketID)
	if err != nil {
		return 0, err
	}

	// Проверка существования пользователя
	_, err = s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return 0, err
	}

	ticketMessage := &domain.TicketMessage{
		TicketID:  ticketID,
		UserID:    userID,
		Message:   message,
		CreatedAt: time.Now(),
	}

	return s.ticketRepo.AddMessage(ctx, ticketMessage)
}

// GetMessages возвращает список сообщений тикета
func (s *SupportTicketServiceImpl) GetMessages(ctx context.Context, ticketID int64) ([]*domain.TicketMessage, error) {
	return s.ticketRepo.GetMessages(ctx, ticketID)
}

// CloseTicket закрывает тикет
func (s *SupportTicketServiceImpl) CloseTicket(ctx context.Context, id int64) error {
	// Получаем тикет
	ticket, err := s.ticketRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	// Обновляем статус и время закрытия
	ticket.Status = "closed"
	ticket.ClosedAt = time.Now()

	return s.ticketRepo.Update(ctx, ticket)
}
