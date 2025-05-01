package service

import (
	"context"

	"github.com/usedcvnt/Diplom1Project/backend/internal/domain"
	"github.com/usedcvnt/Diplom1Project/backend/internal/repository"
)

// countryService реализует интерфейс CountryService
type countryService struct {
	repo repository.CountryRepository
}

// NewCountryService создает новый экземпляр countryService
func NewCountryService(repo repository.CountryRepository) CountryService {
	return &countryService{
		repo: repo,
	}
}

// GetByID возвращает страну по ее ID
func (s *countryService) GetByID(ctx context.Context, id int64) (*domain.Country, error) {
	return s.repo.GetByID(ctx, id)
}

// List возвращает список стран с пагинацией
func (s *countryService) List(ctx context.Context, page, size int) ([]*domain.Country, int, error) {
	if page < 1 {
		page = 1
	}
	if size < 1 {
		size = 10
	}
	offset := (page - 1) * size

	countries, err := s.repo.List(ctx, offset, size)
	if err != nil {
		return nil, 0, err
	}

	total, err := s.repo.Count(ctx)
	if err != nil {
		return nil, 0, err
	}

	return countries, total, nil
}
