package service

import (
	"context"
	"errors"

	"github.com/usedcvnt/Diplom1Project/backend/internal/domain"
	"github.com/usedcvnt/Diplom1Project/backend/internal/repository"
)

// OrderServiceImpl реализация сервиса для работы с заказами
type OrderServiceImpl struct {
	orderRepo repository.OrderRepository
	tourRepo  repository.TourRepository
	userRepo  repository.UserRepository
	roomRepo  repository.RoomRepository
}

// NewOrderService создает новый сервис для работы с заказами
func NewOrderService(orderRepo repository.OrderRepository, tourRepo repository.TourRepository, userRepo repository.UserRepository, roomRepo repository.RoomRepository) OrderService {
	return &OrderServiceImpl{
		orderRepo: orderRepo,
		tourRepo:  tourRepo,
		userRepo:  userRepo,
		roomRepo:  roomRepo,
	}
}

// Create создает новый заказ
func (s *OrderServiceImpl) Create(ctx context.Context, userID, tourID, tourDateID int64, roomID *int64, peopleCount int) (int64, error) {
	// Проверка существования пользователя, тура и даты тура
	// Подсчет общей стоимости
	price, err := s.CalculatePrice(ctx, tourID, tourDateID, roomID, peopleCount)
	if err != nil {
		return 0, err
	}

	order := &domain.Order{
		UserID:      userID,
		TourID:      tourID,
		TourDateID:  tourDateID,
		RoomID:      roomID,
		PeopleCount: peopleCount,
		TotalPrice:  price,
		Status:      "pending",
	}

	return s.orderRepo.Create(ctx, order)
}

// GetByID получает заказ по ID
func (s *OrderServiceImpl) GetByID(ctx context.Context, id int64) (*domain.Order, error) {
	return s.orderRepo.GetByID(ctx, id)
}

// Update обновляет данные заказа
func (s *OrderServiceImpl) Update(ctx context.Context, order *domain.Order) error {
	return s.orderRepo.Update(ctx, order)
}

// Delete удаляет заказ
func (s *OrderServiceImpl) Delete(ctx context.Context, id int64) error {
	return s.orderRepo.Delete(ctx, id)
}

// ListByUserID возвращает список заказов пользователя
func (s *OrderServiceImpl) ListByUserID(ctx context.Context, userID int64) ([]*domain.Order, error) {
	return s.orderRepo.ListByUserID(ctx, userID)
}

// List возвращает список заказов с фильтрацией
func (s *OrderServiceImpl) List(ctx context.Context, filters map[string]interface{}, page, size int) ([]*domain.Order, int, error) {
	orders, err := s.orderRepo.List(ctx, filters, page, size)
	if err != nil {
		return nil, 0, err
	}

	totalCount, err := s.orderRepo.Count(ctx, filters)
	if err != nil {
		return nil, 0, err
	}

	return orders, totalCount, nil
}

// UpdateStatus обновляет статус заказа
func (s *OrderServiceImpl) UpdateStatus(ctx context.Context, id int64, status string) error {
	return s.orderRepo.UpdateStatus(ctx, id, status)
}

// CalculatePrice рассчитывает стоимость заказа
func (s *OrderServiceImpl) CalculatePrice(ctx context.Context, tourID, tourDateID int64, roomID *int64, peopleCount int) (float64, error) {
	// Получение базовой цены тура
	tour, err := s.tourRepo.GetByID(ctx, tourID)
	if err != nil {
		return 0, err
	}

	// Получение даты тура
	var tourDate *domain.TourDate
	tourDates, err := s.tourRepo.GetTourDates(ctx, tourID)
	if err != nil {
		return 0, err
	}

	// Ищем нужную дату среди доступных дат тура
	for _, td := range tourDates {
		if td.ID == tourDateID {
			tourDate = td
			break
		}
	}

	if tourDate == nil {
		return 0, errors.New("tour date not found")
	}

	// Базовая стоимость = базовая цена тура * модификатор даты * количество человек
	basePrice := tour.BasePrice * tourDate.PriceModifier * float64(peopleCount)

	// Если выбран номер, добавляем его стоимость
	var roomPrice float64 = 0
	if roomID != nil && s.roomRepo != nil {
		// Получаем информацию о комнате
		room, err := s.roomRepo.GetByID(ctx, *roomID)
		if err != nil {
			return 0, err
		}

		// Вычисляем продолжительность пребывания на основе дат тура
		duration := tour.Duration

		// Добавляем стоимость номера за весь период пребывания
		roomPrice = room.PricePerNight * float64(duration)
	}

	return basePrice + roomPrice, nil
}
