package repository

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
	"github.com/usedcvnt/Diplom1Project/backend/internal/domain"
)

// roomRepository реализация RoomRepository
type roomRepository struct {
	db *sqlx.DB
}

// NewRoomRepository создает новый экземпляр RoomRepository
func NewRoomRepository(db *sqlx.DB) RoomRepository {
	return &roomRepository{db: db}
}

// Create создает новый номер отеля
func (r *roomRepository) Create(ctx context.Context, room *domain.Room) (int64, error) {
	query := `
		INSERT INTO rooms (hotel_id, description, beds, price, image_url)
		VALUES (?, ?, ?, ?, ?)
	`

	result, err := r.db.ExecContext(
		ctx,
		query,
		room.HotelID,
		room.Description,
		room.Beds,
		room.Price,
		room.ImageURL,
	)
	if err != nil {
		return 0, fmt.Errorf("ошибка при создании номера: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("ошибка при получении ID созданного номера: %w", err)
	}

	return id, nil
}

// GetByID получает номер отеля по ID
func (r *roomRepository) GetByID(ctx context.Context, id int64) (*domain.Room, error) {
	query := `
		SELECT id, hotel_id, description, beds, price, image_url
		FROM rooms
		WHERE id = ?
	`

	var room domain.Room
	err := r.db.GetContext(ctx, &room, query, id)
	if err != nil {
		return nil, fmt.Errorf("ошибка при получении номера: %w", err)
	}

	return &room, nil
}

// Update обновляет информацию о номере отеля
func (r *roomRepository) Update(ctx context.Context, room *domain.Room) error {
	query := `
		UPDATE rooms
		SET hotel_id = ?, description = ?, beds = ?, price = ?, image_url = ?
		WHERE id = ?
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		room.HotelID,
		room.Description,
		room.Beds,
		room.Price,
		room.ImageURL,
		room.ID,
	)
	if err != nil {
		return fmt.Errorf("ошибка при обновлении номера: %w", err)
	}

	return nil
}

// Delete удаляет номер отеля по ID
func (r *roomRepository) Delete(ctx context.Context, id int64) error {
	query := "DELETE FROM rooms WHERE id = ?"

	_, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("ошибка при удалении номера: %w", err)
	}

	return nil
}

// ListByHotelID возвращает список номеров отеля
func (r *roomRepository) ListByHotelID(ctx context.Context, hotelID int64) ([]*domain.Room, error) {
	query := `
		SELECT id, hotel_id, description, beds, price, image_url
		FROM rooms
		WHERE hotel_id = ?
		ORDER BY price
	`

	var rooms []*domain.Room
	err := r.db.SelectContext(ctx, &rooms, query, hotelID)
	if err != nil {
		return nil, fmt.Errorf("ошибка при получении списка номеров: %w", err)
	}

	return rooms, nil
}
