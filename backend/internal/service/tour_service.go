package service

import (
	"context"
	"errors"

	"github.com/usedcvnt/Diplom1Project/backend/internal/domain"
	"github.com/usedcvnt/Diplom1Project/backend/internal/repository"
)

// TourService предоставляет функциональность для работы с турами
type TourService struct {
	tourRepo     repository.TourRepository
	tourDateRepo repository.TourDateRepository
	cityRepo     repository.CityRepository
}

// NewTourService создает новый сервис для работы с турами
func NewTourService(
	tourRepo repository.TourRepository,
	tourDateRepo repository.TourDateRepository,
	cityRepo repository.CityRepository,
) *TourService {
	return &TourService{
		tourRepo:     tourRepo,
		tourDateRepo: tourDateRepo,
		cityRepo:     cityRepo,
	}
}

// GetTours возвращает список туров с фильтрацией
func (s *TourService) GetTours(ctx context.Context, filter domain.TourFilter) ([]domain.Tour, int, error) {
	// Реализация получения списка туров с применением фильтрации
	tours, total, err := s.tourRepo.FindTours(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	// Получение информации о городах для каждого тура
	for i := range tours {
		city, err := s.cityRepo.FindByID(ctx, tours[i].CityID)
		if err == nil {
			tours[i].City = city
		}
	}

	return tours, total, nil
}

// GetTourByID возвращает информацию о туре по его ID
func (s *TourService) GetTourByID(ctx context.Context, id int) (*domain.Tour, error) {
	// Получение тура по ID
	tour, err := s.tourRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Получение информации о городе
	city, err := s.cityRepo.FindByID(ctx, tour.CityID)
	if err == nil {
		tour.City = city
	}

	// Получение доступных дат для тура
	tourDates, err := s.tourDateRepo.FindByTourID(ctx, id)
	if err == nil {
		// Добавление информации о датах в ответ (не в саму модель)
		// В реальной имплементации возможно потребуется создать отдельную структуру для ответа
		// которая будет включать тур и его даты
	}

	return tour, nil
}

// CreateTour создает новый тур
func (s *TourService) CreateTour(ctx context.Context, tour domain.Tour) (int, error) {
	// Проверка существования города
	_, err := s.cityRepo.FindByID(ctx, tour.CityID)
	if err != nil {
		return 0, errors.New("город не найден")
	}

	// Создание тура
	return s.tourRepo.Create(ctx, tour)
}

// UpdateTour обновляет информацию о туре
func (s *TourService) UpdateTour(ctx context.Context, id int, tour domain.Tour) error {
	// Проверка существования тура
	existingTour, err := s.tourRepo.FindByID(ctx, id)
	if err != nil {
		return errors.New("тур не найден")
	}

	// Проверка существования города, если он меняется
	if existingTour.CityID != tour.CityID {
		_, err := s.cityRepo.FindByID(ctx, tour.CityID)
		if err != nil {
			return errors.New("город не найден")
		}
	}

	// Обновление тура
	tour.ID = id // Убедимся, что ID правильный
	return s.tourRepo.Update(ctx, tour)
}

// DeleteTour удаляет тур по ID
func (s *TourService) DeleteTour(ctx context.Context, id int) error {
	// Проверка существования тура
	_, err := s.tourRepo.FindByID(ctx, id)
	if err != nil {
		return errors.New("тур не найден")
	}

	// Удаление тура
	return s.tourRepo.Delete(ctx, id)
}

// AddTourDate добавляет новую доступную дату для тура
func (s *TourService) AddTourDate(ctx context.Context, tourDate domain.TourDate) (int, error) {
	// Проверка существования тура
	_, err := s.tourRepo.FindByID(ctx, tourDate.TourID)
	if err != nil {
		return 0, errors.New("тур не найден")
	}

	// Проверка, что дата начала меньше даты окончания
	if tourDate.StartDate.After(tourDate.EndDate) {
		return 0, errors.New("дата начала не может быть позже даты окончания")
	}

	// Создание доступной даты
	return s.tourDateRepo.Create(ctx, tourDate)
}

// DeleteTourDate удаляет доступную дату тура
func (s *TourService) DeleteTourDate(ctx context.Context, id int) error {
	// Проверка существования даты тура
	_, err := s.tourDateRepo.FindByID(ctx, id)
	if err != nil {
		return errors.New("дата тура не найдена")
	}

	// Удаление даты тура
	return s.tourDateRepo.Delete(ctx, id)
}
