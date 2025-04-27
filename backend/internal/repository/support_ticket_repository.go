package repository

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
	"github.com/usedcvnt/Diplom1Project/backend/internal/domain"
)

// supportTicketRepository реализация SupportTicketRepository
type supportTicketRepository struct {
	db *sqlx.DB
}

// NewSupportTicketRepository создает новый экземпляр SupportTicketRepository
func NewSupportTicketRepository(db *sqlx.DB) SupportTicketRepository {
	return &supportTicketRepository{db: db}
}

// Create создает новый тикет поддержки
func (r *supportTicketRepository) Create(ctx context.Context, ticket *domain.SupportTicket) (int64, error) {
	query := `
		INSERT INTO support_tickets (user_id, subject, status)
		VALUES (?, ?, ?)
	`

	result, err := r.db.ExecContext(
		ctx,
		query,
		ticket.UserID,
		ticket.Subject,
		ticket.Status,
	)
	if err != nil {
		return 0, fmt.Errorf("ошибка при создании тикета: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("ошибка при получении ID созданного тикета: %w", err)
	}

	// Если передан InitialMessage, добавляем его как первое сообщение
	if ticket.InitialMessage != "" {
		messageQuery := `
			INSERT INTO ticket_messages (ticket_id, user_id, message)
			VALUES (?, ?, ?)
		`
		_, err = r.db.ExecContext(ctx, messageQuery, id, ticket.UserID, ticket.InitialMessage)
		if err != nil {
			return id, fmt.Errorf("тикет создан, но ошибка при добавлении первого сообщения: %w", err)
		}
	}

	return id, nil
}

// GetByID получает тикет поддержки по ID
func (r *supportTicketRepository) GetByID(ctx context.Context, id int64) (*domain.SupportTicket, error) {
	query := `
		SELECT id, user_id, subject, status, created_at
		FROM support_tickets
		WHERE id = ?
	`

	var ticket domain.SupportTicket
	err := r.db.GetContext(ctx, &ticket, query, id)
	if err != nil {
		return nil, fmt.Errorf("ошибка при получении тикета: %w", err)
	}

	return &ticket, nil
}

// Update обновляет информацию о тикете поддержки
func (r *supportTicketRepository) Update(ctx context.Context, ticket *domain.SupportTicket) error {
	query := `
		UPDATE support_tickets
		SET subject = ?, status = ?
		WHERE id = ?
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		ticket.Subject,
		ticket.Status,
		ticket.ID,
	)
	if err != nil {
		return fmt.Errorf("ошибка при обновлении тикета: %w", err)
	}

	return nil
}

// Delete удаляет тикет поддержки по ID
func (r *supportTicketRepository) Delete(ctx context.Context, id int64) error {
	// Сначала удаляем все сообщения
	messageQuery := "DELETE FROM ticket_messages WHERE ticket_id = ?"
	_, err := r.db.ExecContext(ctx, messageQuery, id)
	if err != nil {
		return fmt.Errorf("ошибка при удалении сообщений тикета: %w", err)
	}

	// Затем удаляем сам тикет
	query := "DELETE FROM support_tickets WHERE id = ?"
	_, err = r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("ошибка при удалении тикета: %w", err)
	}

	return nil
}

// ListByUserID возвращает список тикетов поддержки пользователя
func (r *supportTicketRepository) ListByUserID(ctx context.Context, userID int64) ([]*domain.SupportTicket, error) {
	query := `
		SELECT id, user_id, subject, status, created_at
		FROM support_tickets
		WHERE user_id = ?
		ORDER BY created_at DESC
	`

	var tickets []*domain.SupportTicket
	err := r.db.SelectContext(ctx, &tickets, query, userID)
	if err != nil {
		return nil, fmt.Errorf("ошибка при получении списка тикетов пользователя: %w", err)
	}

	return tickets, nil
}

// List возвращает список тикетов поддержки с фильтрацией
func (r *supportTicketRepository) List(ctx context.Context, filters map[string]interface{}, offset, limit int) ([]*domain.SupportTicket, error) {
	query := `
		SELECT id, user_id, subject, status, created_at
		FROM support_tickets
		WHERE 1=1
	`

	var args []interface{}

	// Обработка фильтров
	if filters != nil {
		if userID, ok := filters["user_id"]; ok {
			query += " AND user_id = ?"
			args = append(args, userID)
		}
		if status, ok := filters["status"]; ok {
			query += " AND status = ?"
			args = append(args, status)
		}
	}

	query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	var tickets []*domain.SupportTicket
	err := r.db.SelectContext(ctx, &tickets, query, args...)
	if err != nil {
		return nil, fmt.Errorf("ошибка при получении списка тикетов: %w", err)
	}

	return tickets, nil
}

// Count возвращает количество тикетов поддержки с учетом фильтрации
func (r *supportTicketRepository) Count(ctx context.Context, filters map[string]interface{}) (int, error) {
	query := `
		SELECT COUNT(*)
		FROM support_tickets
		WHERE 1=1
	`

	var args []interface{}

	// Обработка фильтров
	if filters != nil {
		if userID, ok := filters["user_id"]; ok {
			query += " AND user_id = ?"
			args = append(args, userID)
		}
		if status, ok := filters["status"]; ok {
			query += " AND status = ?"
			args = append(args, status)
		}
	}

	var count int
	err := r.db.GetContext(ctx, &count, query, args...)
	if err != nil {
		return 0, fmt.Errorf("ошибка при подсчете тикетов: %w", err)
	}

	return count, nil
}

// UpdateStatus обновляет статус тикета поддержки
func (r *supportTicketRepository) UpdateStatus(ctx context.Context, id int64, status string) error {
	query := "UPDATE support_tickets SET status = ? WHERE id = ?"

	_, err := r.db.ExecContext(ctx, query, status, id)
	if err != nil {
		return fmt.Errorf("ошибка при обновлении статуса тикета: %w", err)
	}

	return nil
}

// AddMessage добавляет сообщение в тикет поддержки
func (r *supportTicketRepository) AddMessage(ctx context.Context, message *domain.TicketMessage) (int64, error) {
	query := `
		INSERT INTO ticket_messages (ticket_id, user_id, message)
		VALUES (?, ?, ?)
	`

	result, err := r.db.ExecContext(
		ctx,
		query,
		message.TicketID,
		message.UserID,
		message.Message,
	)
	if err != nil {
		return 0, fmt.Errorf("ошибка при добавлении сообщения: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("ошибка при получении ID созданного сообщения: %w", err)
	}

	return id, nil
}

// GetMessages получает все сообщения тикета поддержки
func (r *supportTicketRepository) GetMessages(ctx context.Context, ticketID int64) ([]*domain.TicketMessage, error) {
	query := `
		SELECT id, ticket_id, user_id, message, created_at
		FROM ticket_messages
		WHERE ticket_id = ?
		ORDER BY created_at
	`

	var messages []*domain.TicketMessage
	err := r.db.SelectContext(ctx, &messages, query, ticketID)
	if err != nil {
		return nil, fmt.Errorf("ошибка при получении сообщений тикета: %w", err)
	}

	return messages, nil
}
