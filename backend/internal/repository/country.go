package repository

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
	"github.com/usedcvnt/Diplom1Project/backend/internal/domain"
)

// countryRepository реализует интерфейс CountryRepository
type countryRepository struct {
	db *sqlx.DB
}

// NewCountryRepository создает новый экземпляр countryRepository
func NewCountryRepository(db *sqlx.DB) CountryRepository {
	return &countryRepository{
		db: db,
	}
}

// GetByID возвращает страну по ее ID
func (r *countryRepository) GetByID(ctx context.Context, id int64) (*domain.Country, error) {
	var country domain.Country
	query := `SELECT id, name, code FROM countries WHERE id = ?`
	err := r.db.GetContext(ctx, &country, query, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get country by id: %w", err)
	}
	return &country, nil
}

// List возвращает список стран с пагинацией
func (r *countryRepository) List(ctx context.Context, offset, limit int) ([]*domain.Country, error) {
	countries := make([]*domain.Country, 0)
	query := `SELECT id, name, code FROM countries ORDER BY name LIMIT ? OFFSET ?`
	err := r.db.SelectContext(ctx, &countries, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list countries: %w", err)
	}
	return countries, nil
}

// Count возвращает общее количество стран
func (r *countryRepository) Count(ctx context.Context) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM countries`
	err := r.db.GetContext(ctx, &count, query)
	if err != nil {
		return 0, fmt.Errorf("failed to count countries: %w", err)
	}
	return count, nil
}
