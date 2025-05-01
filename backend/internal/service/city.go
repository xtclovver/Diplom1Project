package service

import (
	"context"

	"github.com/usedcvnt/Diplom1Project/backend/internal/domain"
	"github.com/usedcvnt/Diplom1Project/backend/internal/repository"
)

// cityService реализует интерфейс CityService
type cityService struct {
	repo repository.CityRepository
}

// NewCityService создает новый экземпляр cityService
func NewCityService(repo repository.CityRepository) CityService {
	return &cityService{
		repo: repo,
	}
}

// GetByID возвращает город по его ID
func (s *cityService) GetByID(ctx context.Context, id int64) (*domain.City, error) {
	return s.repo.GetByID(ctx, id)
}

// List возвращает список городов с пагинацией
func (s *cityService) List(ctx context.Context, page, size int) ([]*domain.City, int, error) {
	if page < 1 {
		page = 1
	}
	if size < 1 {
		size = 10
	}
	offset := (page - 1) * size

	cities, err := s.repo.List(ctx, offset, size)
	if err != nil {
		return nil, 0, err
	}

	total, err := s.repo.Count(ctx)
	if err != nil {
		return nil, 0, err
	}

	return cities, total, nil
}

// ListByCountryID возвращает список городов по ID страны
func (s *cityService) ListByCountryID(ctx context.Context, countryID int64) ([]*domain.City, error) {
	return s.repo.ListByCountryID(ctx, countryID)
}
