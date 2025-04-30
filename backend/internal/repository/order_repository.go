package repository

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
	"github.com/usedcvnt/Diplom1Project/backend/internal/domain"
)

// sqlxTx реализация интерфейса Tx
type sqlxTx struct {
	tx *sqlx.Tx
}

func (t *sqlxTx) Commit() error {
	return t.tx.Commit()
}

func (t *sqlxTx) Rollback() error {
	return t.tx.Rollback()
}

// orderRepository реализация OrderRepository
type orderRepository struct {
	db *sqlx.DB
}

// NewOrderRepository создает новый экземпляр OrderRepository
func NewOrderRepository(db *sqlx.DB) OrderRepository {
	return &orderRepository{db: db}
}

// BeginTx начинает новую транзакцию
func (r *orderRepository) BeginTx(ctx context.Context) (Tx, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("ошибка при начале транзакции: %w", err)
	}
	return &sqlxTx{tx: tx}, nil
}

// Create создает новый заказ
func (r *orderRepository) Create(ctx context.Context, order *domain.Order) (int64, error) {
	query := `
		INSERT INTO orders (user_id, tour_id, tour_date_id, room_id, people_count, total_price, status)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`

	result, err := r.db.ExecContext(
		ctx,
		query,
		order.UserID,
		order.TourID,
		order.TourDateID,
		order.RoomID,
		order.PeopleCount,
		order.TotalPrice,
		order.Status,
	)
	if err != nil {
		return 0, fmt.Errorf("ошибка при создании заказа: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("ошибка при получении ID созданного заказа: %w", err)
	}

	return id, nil
}

// CreateTx создает новый заказ в рамках транзакции
func (r *orderRepository) CreateTx(ctx context.Context, tx Tx, order *domain.Order) (int64, error) {
	query := `
		INSERT INTO orders (user_id, tour_id, tour_date_id, room_id, people_count, total_price, status)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`

	sqlxTx := tx.(*sqlxTx)

	result, err := sqlxTx.tx.ExecContext(
		ctx,
		query,
		order.UserID,
		order.TourID,
		order.TourDateID,
		order.RoomID,
		order.PeopleCount,
		order.TotalPrice,
		order.Status,
	)
	if err != nil {
		return 0, fmt.Errorf("ошибка при создании заказа в транзакции: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("ошибка при получении ID созданного заказа в транзакции: %w", err)
	}

	return id, nil
}

// GetByID получает заказ по ID
func (r *orderRepository) GetByID(ctx context.Context, id int64) (*domain.Order, error) {
	query := `
		SELECT id, user_id, tour_id, tour_date_id, room_id, people_count, total_price, status, created_at
		FROM orders
		WHERE id = ?
	`

	var order domain.Order
	err := r.db.GetContext(ctx, &order, query, id)
	if err != nil {
		return nil, fmt.Errorf("ошибка при получении заказа: %w", err)
	}

	return &order, nil
}

// Update обновляет информацию о заказе
func (r *orderRepository) Update(ctx context.Context, order *domain.Order) error {
	query := `
		UPDATE orders
		SET user_id = ?, tour_id = ?, tour_date_id = ?, room_id = ?, people_count = ?, total_price = ?, status = ?
		WHERE id = ?
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		order.UserID,
		order.TourID,
		order.TourDateID,
		order.RoomID,
		order.PeopleCount,
		order.TotalPrice,
		order.Status,
		order.ID,
	)
	if err != nil {
		return fmt.Errorf("ошибка при обновлении заказа: %w", err)
	}

	return nil
}

// Delete удаляет заказ по ID
func (r *orderRepository) Delete(ctx context.Context, id int64) error {
	query := "DELETE FROM orders WHERE id = ?"

	_, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("ошибка при удалении заказа: %w", err)
	}

	return nil
}

// ListByUserID возвращает список заказов пользователя
func (r *orderRepository) ListByUserID(ctx context.Context, userID int64) ([]*domain.Order, error) {
	query := `
		SELECT id, user_id, tour_id, tour_date_id, room_id, people_count, total_price, status, created_at
		FROM orders
		WHERE user_id = ?
		ORDER BY created_at DESC
	`

	var orders []*domain.Order
	err := r.db.SelectContext(ctx, &orders, query, userID)
	if err != nil {
		return nil, fmt.Errorf("ошибка при получении списка заказов пользователя: %w", err)
	}

	return orders, nil
}

// List возвращает список заказов с фильтрацией
func (r *orderRepository) List(ctx context.Context, filters map[string]interface{}, offset, limit int) ([]*domain.Order, error) {
	query := `
		SELECT id, user_id, tour_id, tour_date_id, room_id, people_count, total_price, status, created_at
		FROM orders
		WHERE 1=1
	`

	var args []interface{}

	// Обработка фильтров
	if filters != nil {
		if userID, ok := filters["user_id"]; ok {
			query += " AND user_id = ?"
			args = append(args, userID)
		}
		if tourID, ok := filters["tour_id"]; ok {
			query += " AND tour_id = ?"
			args = append(args, tourID)
		}
		if status, ok := filters["status"]; ok {
			query += " AND status = ?"
			args = append(args, status)
		}
	}

	query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	var orders []*domain.Order
	err := r.db.SelectContext(ctx, &orders, query, args...)
	if err != nil {
		return nil, fmt.Errorf("ошибка при получении списка заказов: %w", err)
	}

	return orders, nil
}

// Count возвращает количество заказов с учетом фильтрации
func (r *orderRepository) Count(ctx context.Context, filters map[string]interface{}) (int, error) {
	query := `
		SELECT COUNT(*)
		FROM orders
		WHERE 1=1
	`

	var args []interface{}

	// Обработка фильтров
	if filters != nil {
		if userID, ok := filters["user_id"]; ok {
			query += " AND user_id = ?"
			args = append(args, userID)
		}
		if tourID, ok := filters["tour_id"]; ok {
			query += " AND tour_id = ?"
			args = append(args, tourID)
		}
		if status, ok := filters["status"]; ok {
			query += " AND status = ?"
			args = append(args, status)
		}
	}

	var count int
	err := r.db.GetContext(ctx, &count, query, args...)
	if err != nil {
		return 0, fmt.Errorf("ошибка при подсчете заказов: %w", err)
	}

	return count, nil
}

// UpdateStatus обновляет статус заказа
func (r *orderRepository) UpdateStatus(ctx context.Context, id int64, status string) error {
	query := "UPDATE orders SET status = ? WHERE id = ?"

	_, err := r.db.ExecContext(ctx, query, status, id)
	if err != nil {
		return fmt.Errorf("ошибка при обновлении статуса заказа: %w", err)
	}

	return nil
}

// UpdateStatusTx обновляет статус заказа в рамках транзакции
func (r *orderRepository) UpdateStatusTx(ctx context.Context, tx Tx, id int64, status string) error {
	query := "UPDATE orders SET status = ? WHERE id = ?"

	sqlxTx := tx.(*sqlxTx)

	_, err := sqlxTx.tx.ExecContext(ctx, query, status, id)
	if err != nil {
		return fmt.Errorf("ошибка при обновлении статуса заказа в транзакции: %w", err)
	}

	return nil
}
