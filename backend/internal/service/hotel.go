package service

import (
	"context"

	"github.com/usedcvnt/Diplom1Project/backend/internal/domain"
	"github.com/usedcvnt/Diplom1Project/backend/internal/repository"
)

// HotelServiceImpl реализация сервиса для работы с отелями
type HotelServiceImpl struct {
	hotelRepo repository.HotelRepository
	roomRepo  repository.RoomRepository
}

// NewHotelService создает новый сервис для работы с отелями
func NewHotelService(hotelRepo repository.HotelRepository, roomRepo repository.RoomRepository) HotelService {
	return &HotelServiceImpl{
		hotelRepo: hotelRepo,
		roomRepo:  roomRepo,
	}
}

// Create создает новый отель
func (s *HotelServiceImpl) Create(ctx context.Context, hotel *domain.Hotel) (int64, error) {
	return s.hotelRepo.Create(ctx, hotel)
}

// GetByID получает отель по ID
func (s *HotelServiceImpl) GetByID(ctx context.Context, id int64) (*domain.Hotel, error) {
	return s.hotelRepo.GetByID(ctx, id)
}

// Update обновляет данные отеля
func (s *HotelServiceImpl) Update(ctx context.Context, hotel *domain.Hotel) error {
	return s.hotelRepo.Update(ctx, hotel)
}

// Delete удаляет отель
func (s *HotelServiceImpl) Delete(ctx context.Context, id int64) error {
	return s.hotelRepo.Delete(ctx, id)
}

// List возвращает список отелей с фильтрацией
func (s *HotelServiceImpl) List(ctx context.Context, filters map[string]interface{}, page, size int) ([]*domain.Hotel, int, error) {
	hotels, err := s.hotelRepo.List(ctx, filters, page, size)
	if err != nil {
		return nil, 0, err
	}

	// Предполагаем, что репозиторий может вернуть общее количество отелей
	// Если нет, можно добавить отдельный метод для получения количества
	totalCount, err := s.hotelRepo.Count(ctx, filters)
	if err != nil {
		return nil, 0, err
	}

	return hotels, totalCount, nil
}

// AddRoom добавляет новый номер в отель
func (s *HotelServiceImpl) AddRoom(ctx context.Context, room *domain.Room) (int64, error) {
	return s.roomRepo.Create(ctx, room)
}

// GetRoomByID получает номер по ID
func (s *HotelServiceImpl) GetRoomByID(ctx context.Context, id int64) (*domain.Room, error) {
	return s.roomRepo.GetByID(ctx, id)
}

// UpdateRoom обновляет данные номера
func (s *HotelServiceImpl) UpdateRoom(ctx context.Context, room *domain.Room) error {
	return s.roomRepo.Update(ctx, room)
}

// DeleteRoom удаляет номер
func (s *HotelServiceImpl) DeleteRoom(ctx context.Context, id int64) error {
	return s.roomRepo.Delete(ctx, id)
}

// ListRoomsByHotelID возвращает список номеров в отеле
func (s *HotelServiceImpl) ListRoomsByHotelID(ctx context.Context, hotelID int64) ([]*domain.Room, error) {
	return s.roomRepo.ListByHotelID(ctx, hotelID)
}
