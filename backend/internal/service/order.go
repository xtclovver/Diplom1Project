package service

import (
	"context"
	"errors"
	"fmt"

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
	// Проверка существования пользователя
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return 0, fmt.Errorf("ошибка при проверке пользователя: %w", err)
	}
	if user == nil {
		return 0, errors.New("пользователь не найден")
	}

	// Проверка существования тура
	tour, err := s.tourRepo.GetByID(ctx, tourID)
	if err != nil {
		return 0, fmt.Errorf("ошибка при проверке тура: %w", err)
	}
	if tour == nil {
		return 0, errors.New("тур не найден")
	}

	// Получение даты тура
	var tourDate *domain.TourDate
	tourDates, err := s.tourRepo.GetTourDates(ctx, tourID)
	if err != nil {
		return 0, fmt.Errorf("ошибка при получении дат тура: %w", err)
	}

	// Ищем нужную дату среди доступных дат тура
	for _, td := range tourDates {
		if td.ID == tourDateID {
			tourDate = td
			break
		}
	}

	if tourDate == nil {
		return 0, errors.New("выбранная дата тура не найдена")
	}

	// Проверка доступности мест
	if tourDate.Availability < peopleCount {
		return 0, fmt.Errorf("недостаточно свободных мест на выбранную дату (доступно: %d, запрошено: %d)", tourDate.Availability, peopleCount)
	}

	// Если указан ID номера, проверяем его существование
	if roomID != nil {
		room, err := s.roomRepo.GetByID(ctx, *roomID)
		if err != nil {
			return 0, fmt.Errorf("ошибка при проверке номера: %w", err)
		}
		if room == nil {
			return 0, errors.New("выбранный номер не найден")
		}

		// Проверка вместимости номера
		if room.Capacity < peopleCount {
			return 0, fmt.Errorf("выбранный номер вмещает максимум %d человек", room.Capacity)
		}
	}

	// Подсчет общей стоимости
	price, err := s.CalculatePrice(ctx, tourID, tourDateID, roomID, peopleCount)
	if err != nil {
		return 0, fmt.Errorf("ошибка при расчете стоимости: %w", err)
	}

	// Создаем заказ
	order := &domain.Order{
		UserID:      userID,
		TourID:      tourID,
		TourDateID:  tourDateID,
		RoomID:      roomID,
		PeopleCount: peopleCount,
		TotalPrice:  price,
		Status:      string(domain.OrderStatusPending),
	}

	// Начинаем транзакцию
	tx, err := s.orderRepo.BeginTx(ctx)
	if err != nil {
		return 0, fmt.Errorf("ошибка при начале транзакции: %w", err)
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// Создаем заказ
	orderID, err := s.orderRepo.CreateTx(ctx, tx, order)
	if err != nil {
		return 0, fmt.Errorf("ошибка при создании заказа: %w", err)
	}

	// Уменьшаем доступность мест для выбранной даты тура
	updatedAvailability := tourDate.Availability - peopleCount
	err = s.tourRepo.UpdateTourDateAvailabilityTx(ctx, tx, tourDateID, updatedAvailability)
	if err != nil {
		return 0, fmt.Errorf("ошибка при обновлении доступности мест: %w", err)
	}

	// Коммитим транзакцию
	if err = tx.Commit(); err != nil {
		return 0, fmt.Errorf("ошибка при коммите транзакции: %w", err)
	}

	return orderID, nil
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
	// Валидация статуса
	if status != string(domain.OrderStatusPending) &&
		status != string(domain.OrderStatusConfirmed) &&
		status != string(domain.OrderStatusPaid) &&
		status != string(domain.OrderStatusCancelled) &&
		status != string(domain.OrderStatusCompleted) {
		return errors.New("недопустимый статус заказа")
	}

	// Получаем текущий заказ
	order, err := s.orderRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("ошибка при получении заказа: %w", err)
	}
	if order == nil {
		return errors.New("заказ не найден")
	}

	// Если статус не меняется - возвращаем успех
	if order.Status == status {
		return nil
	}

	// Проверяем, можно ли изменить статус
	if (order.Status == string(domain.OrderStatusCancelled) || order.Status == string(domain.OrderStatusCompleted)) &&
		(status != string(domain.OrderStatusCancelled) && status != string(domain.OrderStatusCompleted)) {
		return errors.New("невозможно изменить статус завершенного или отмененного заказа")
	}

	// Если заказ отменяется, увеличиваем доступность мест для выбранной даты тура
	if status == string(domain.OrderStatusCancelled) &&
		(order.Status == string(domain.OrderStatusPending) || order.Status == string(domain.OrderStatusConfirmed)) {

		// Начинаем транзакцию
		tx, err := s.orderRepo.BeginTx(ctx)
		if err != nil {
			return fmt.Errorf("ошибка при начале транзакции: %w", err)
		}
		defer func() {
			if err != nil {
				tx.Rollback()
			}
		}()

		// Обновляем статус заказа
		if err = s.orderRepo.UpdateStatusTx(ctx, tx, id, status); err != nil {
			return fmt.Errorf("ошибка при обновлении статуса заказа: %w", err)
		}

		// Получаем текущую доступность мест
		tourDate, err := s.tourRepo.GetTourDateByID(ctx, order.TourDateID)
		if err != nil {
			return fmt.Errorf("ошибка при получении даты тура: %w", err)
		}

		// Увеличиваем доступность мест
		updatedAvailability := tourDate.Availability + order.PeopleCount
		if err = s.tourRepo.UpdateTourDateAvailabilityTx(ctx, tx, order.TourDateID, updatedAvailability); err != nil {
			return fmt.Errorf("ошибка при обновлении доступности мест: %w", err)
		}

		// Коммитим транзакцию
		if err = tx.Commit(); err != nil {
			return fmt.Errorf("ошибка при коммите транзакции: %w", err)
		}

		return nil
	}

	// В остальных случаях просто обновляем статус
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
