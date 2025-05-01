package repository

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
	"github.com/usedcvnt/Diplom1Project/backend/internal/domain"
)

// cityRepository реализует интерфейс CityRepository
type cityRepository struct {
	db *sqlx.DB
}

// NewCityRepository создает новый экземпляр cityRepository
func NewCityRepository(db *sqlx.DB) CityRepository {
	return &cityRepository{
		db: db,
	}
}

// GetByID возвращает город по его ID
func (r *cityRepository) GetByID(ctx context.Context, id int64) (*domain.City, error) {
	var city domain.City
	query := `SELECT id, country_id, name FROM cities WHERE id = ?`
	err := r.db.GetContext(ctx, &city, query, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get city by id: %w", err)
	}
	return &city, nil
}

// List возвращает список городов с пагинацией
func (r *cityRepository) List(ctx context.Context, offset, limit int) ([]*domain.City, error) {
	cities := make([]*domain.City, 0)
	query := `SELECT id, country_id, name FROM cities ORDER BY name LIMIT ? OFFSET ?`
	err := r.db.SelectContext(ctx, &cities, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list cities: %w", err)
	}
	return cities, nil
}

// Count возвращает общее количество городов
func (r *cityRepository) Count(ctx context.Context) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM cities`
	err := r.db.GetContext(ctx, &count, query)
	if err != nil {
		return 0, fmt.Errorf("failed to count cities: %w", err)
	}
	return count, nil
}

// ListByCountryID возвращает список городов по ID страны
func (r *cityRepository) ListByCountryID(ctx context.Context, countryID int64) ([]*domain.City, error) {
	cities := make([]*domain.City, 0)
	query := `SELECT id, country_id, name FROM cities WHERE country_id = ? ORDER BY name`
	err := r.db.SelectContext(ctx, &cities, query, countryID)
	if err != nil {
		return nil, fmt.Errorf("failed to list cities by country id: %w", err)
	}
	return cities, nil
}
