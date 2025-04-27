package service

import (
	"context"

	"github.com/usedcvnt/Diplom1Project/backend/internal/domain"
	"github.com/usedcvnt/Diplom1Project/backend/internal/repository"
)

// TourServiceImpl реализация сервиса для работы с турами
type TourServiceImpl struct {
	repos repository.TourRepository
}

// NewTourService создает новый сервис для работы с турами
func NewTourService(repos repository.TourRepository) TourService {
	return &TourServiceImpl{
		repos: repos,
	}
}

// Create создает новый тур
func (s *TourServiceImpl) Create(ctx context.Context, tour *domain.Tour) (int64, error) {
	return s.repos.Create(ctx, tour)
}

// GetByID получает тур по ID
func (s *TourServiceImpl) GetByID(ctx context.Context, id int64) (*domain.Tour, error) {
	return s.repos.GetByID(ctx, id)
}

// Update обновляет данные тура
func (s *TourServiceImpl) Update(ctx context.Context, tour *domain.Tour) error {
	return s.repos.Update(ctx, tour)
}

// Delete удаляет тур
func (s *TourServiceImpl) Delete(ctx context.Context, id int64) error {
	return s.repos.Delete(ctx, id)
}

// List возвращает список туров с фильтрацией
func (s *TourServiceImpl) List(ctx context.Context, filters map[string]interface{}, page, size int) ([]*domain.Tour, int, error) {
	tours, err := s.repos.List(ctx, filters, page, size)
	if err != nil {
		return nil, 0, err
	}

	totalCount, err := s.repos.Count(ctx, filters)
	if err != nil {
		return nil, 0, err
	}

	return tours, totalCount, nil
}

// AddTourDate добавляет новую дату для тура
func (s *TourServiceImpl) AddTourDate(ctx context.Context, tourDate *domain.TourDate) (int64, error) {
	return s.repos.AddTourDate(ctx, tourDate)
}

// GetTourDates возвращает список доступных дат для тура
func (s *TourServiceImpl) GetTourDates(ctx context.Context, tourID int64) ([]*domain.TourDate, error) {
	return s.repos.GetTourDates(ctx, tourID)
}

// UpdateTourDate обновляет информацию о дате тура
func (s *TourServiceImpl) UpdateTourDate(ctx context.Context, tourDate *domain.TourDate) error {
	return s.repos.UpdateTourDate(ctx, tourDate)
}

// DeleteTourDate удаляет дату тура
func (s *TourServiceImpl) DeleteTourDate(ctx context.Context, id int64) error {
	return s.repos.DeleteTourDate(ctx, id)
}
