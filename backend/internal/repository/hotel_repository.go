package repository

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
	"github.com/usedcvnt/Diplom1Project/backend/internal/domain"
)

// hotelRepository реализация HotelRepository
type hotelRepository struct {
	db *sqlx.DB
}

// NewHotelRepository создает новый экземпляр HotelRepository
func NewHotelRepository(db *sqlx.DB) HotelRepository {
	return &hotelRepository{db: db}
}

// Create создает новый отель
func (r *hotelRepository) Create(ctx context.Context, hotel *domain.Hotel) (int64, error) {
	query := `
		INSERT INTO hotels (city_id, name, description, address, category, image_url, is_active)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`

	result, err := r.db.ExecContext(
		ctx,
		query,
		hotel.CityID,
		hotel.Name,
		hotel.Description,
		hotel.Address,
		hotel.Category,
		hotel.ImageURL,
		hotel.IsActive,
	)
	if err != nil {
		return 0, fmt.Errorf("ошибка при создании отеля: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("ошибка при получении ID созданного отеля: %w", err)
	}

	return id, nil
}

// GetByID получает отель по ID
func (r *hotelRepository) GetByID(ctx context.Context, id int64) (*domain.Hotel, error) {
	query := `
		SELECT id, city_id, name, description, address, category, image_url, is_active, created_at
		FROM hotels
		WHERE id = ?
	`

	var hotel domain.Hotel
	err := r.db.GetContext(ctx, &hotel, query, id)
	if err != nil {
		return nil, fmt.Errorf("ошибка при получении отеля: %w", err)
	}

	return &hotel, nil
}

// Update обновляет информацию об отеле
func (r *hotelRepository) Update(ctx context.Context, hotel *domain.Hotel) error {
	query := `
		UPDATE hotels
		SET city_id = ?, name = ?, description = ?, address = ?, category = ?, image_url = ?, is_active = ?
		WHERE id = ?
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		hotel.CityID,
		hotel.Name,
		hotel.Description,
		hotel.Address,
		hotel.Category,
		hotel.ImageURL,
		hotel.IsActive,
		hotel.ID,
	)
	if err != nil {
		return fmt.Errorf("ошибка при обновлении отеля: %w", err)
	}

	return nil
}

// Delete удаляет отель по ID
func (r *hotelRepository) Delete(ctx context.Context, id int64) error {
	query := "DELETE FROM hotels WHERE id = ?"

	_, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("ошибка при удалении отеля: %w", err)
	}

	return nil
}

// List возвращает список отелей с фильтрацией
func (r *hotelRepository) List(ctx context.Context, filters map[string]interface{}, offset, limit int) ([]*domain.Hotel, error) {
	query := `
		SELECT h.id, h.city_id, h.name, h.description, h.address, h.category, h.image_url, h.is_active, h.created_at
		FROM hotels h
		JOIN cities c ON h.city_id = c.id
		WHERE h.is_active = true
	`

	var args []interface{}

	// Обработка фильтров
	if filters != nil {
		if cityID, ok := filters["city_id"]; ok {
			query += " AND h.city_id = ?"
			args = append(args, cityID)
		}
		if countryID, ok := filters["country_id"]; ok {
			query += " AND c.country_id = ?"
			args = append(args, countryID)
		}
		if categoryMin, ok := filters["category_min"]; ok {
			query += " AND h.category >= ?"
			args = append(args, categoryMin)
		}
		if categoryMax, ok := filters["category_max"]; ok {
			query += " AND h.category <= ?"
			args = append(args, categoryMax)
		}
	}

	query += " ORDER BY h.created_at DESC LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	var hotels []*domain.Hotel
	err := r.db.SelectContext(ctx, &hotels, query, args...)
	if err != nil {
		return nil, fmt.Errorf("ошибка при получении списка отелей: %w", err)
	}

	return hotels, nil
}

// Count возвращает количество отелей с учетом фильтрации
func (r *hotelRepository) Count(ctx context.Context, filters map[string]interface{}) (int, error) {
	query := `
		SELECT COUNT(*)
		FROM hotels h
		JOIN cities c ON h.city_id = c.id
		WHERE h.is_active = true
	`

	var args []interface{}

	// Обработка фильтров
	if filters != nil {
		if cityID, ok := filters["city_id"]; ok {
			query += " AND h.city_id = ?"
			args = append(args, cityID)
		}
		if countryID, ok := filters["country_id"]; ok {
			query += " AND c.country_id = ?"
			args = append(args, countryID)
		}
		if categoryMin, ok := filters["category_min"]; ok {
			query += " AND h.category >= ?"
			args = append(args, categoryMin)
		}
		if categoryMax, ok := filters["category_max"]; ok {
			query += " AND h.category <= ?"
			args = append(args, categoryMax)
		}
	}

	var count int
	err := r.db.GetContext(ctx, &count, query, args...)
	if err != nil {
		return 0, fmt.Errorf("ошибка при подсчете отелей: %w", err)
	}

	return count, nil
}
