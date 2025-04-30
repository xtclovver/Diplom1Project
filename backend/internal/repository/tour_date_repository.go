package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/usedcvnt/Diplom1Project/backend/internal/domain"
)

// TourDateRepository представляет репозиторий для работы с датами туров
type TourDateRepository interface {
	GetByTourID(ctx context.Context, tourID int64) ([]*domain.TourDate, error)
	Create(ctx context.Context, tourDate *domain.TourDate) (int64, error)
	Update(ctx context.Context, tourDate *domain.TourDate) error
	Delete(ctx context.Context, id int64) error
}

type tourDateRepository struct {
	db *sqlx.DB
}

// NewTourDateRepository создает новый экземпляр TourDateRepository
func NewTourDateRepository(db *sqlx.DB) TourDateRepository {
	return &tourDateRepository{db: db}
}

// GetByTourID получает все доступные даты для конкретного тура
func (r *tourDateRepository) GetByTourID(ctx context.Context, tourID int64) ([]*domain.TourDate, error) {
	query := `
		SELECT id, tour_id, start_date, end_date, availability, price_modifier
		FROM tour_dates
		WHERE tour_id = ? AND start_date >= ?
		ORDER BY start_date
	`

	// Получаем только даты, начиная с сегодняшнего дня
	currentDate := time.Now().Format("2006-01-02")

	var tourDates []*domain.TourDate
	err := r.db.SelectContext(ctx, &tourDates, query, tourID, currentDate)
	if err != nil {
		return nil, fmt.Errorf("ошибка при получении дат тура: %w", err)
	}

	return tourDates, nil
}

// Create создает новую дату тура
func (r *tourDateRepository) Create(ctx context.Context, tourDate *domain.TourDate) (int64, error) {
	query := `
		INSERT INTO tour_dates (tour_id, start_date, end_date, availability, price_modifier)
		VALUES (?, ?, ?, ?, ?)
	`

	result, err := r.db.ExecContext(
		ctx,
		query,
		tourDate.TourID,
		tourDate.StartDate,
		tourDate.EndDate,
		tourDate.Availability,
		tourDate.PriceModifier,
	)

	if err != nil {
		return 0, fmt.Errorf("ошибка при создании даты тура: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("ошибка при получении ID созданной даты тура: %w", err)
	}

	return id, nil
}

// Update обновляет дату тура
func (r *tourDateRepository) Update(ctx context.Context, tourDate *domain.TourDate) error {
	query := `
		UPDATE tour_dates
		SET tour_id = ?, start_date = ?, end_date = ?, availability = ?, price_modifier = ?
		WHERE id = ?
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		tourDate.TourID,
		tourDate.StartDate,
		tourDate.EndDate,
		tourDate.Availability,
		tourDate.PriceModifier,
		tourDate.ID,
	)

	if err != nil {
		return fmt.Errorf("ошибка при обновлении даты тура: %w", err)
	}

	return nil
}

// Delete удаляет дату тура
func (r *tourDateRepository) Delete(ctx context.Context, id int64) error {
	query := "DELETE FROM tour_dates WHERE id = ?"

	_, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("ошибка при удалении даты тура: %w", err)
	}

	return nil
}
