package service

import (
	"context"

	"github.com/usedcvnt/Diplom1Project/backend/internal/domain"
	"github.com/usedcvnt/Diplom1Project/backend/internal/repository"
)

// UserServiceImpl реализация сервиса пользователей
type UserServiceImpl struct {
	repos repository.UserRepository
}

// NewUserService создает новый сервис пользователей
func NewUserService(repos repository.UserRepository) UserService {
	return &UserServiceImpl{
		repos: repos,
	}
}

// Create создает нового пользователя
func (s *UserServiceImpl) Create(ctx context.Context, user *domain.User) (int64, error) {
	return s.repos.Create(ctx, user)
}

// GetByID получает пользователя по ID
func (s *UserServiceImpl) GetByID(ctx context.Context, id int64) (*domain.User, error) {
	return s.repos.GetByID(ctx, id)
}

// Update обновляет данные пользователя
func (s *UserServiceImpl) Update(ctx context.Context, user *domain.User) error {
	return s.repos.Update(ctx, user)
}

// Delete удаляет пользователя
func (s *UserServiceImpl) Delete(ctx context.Context, id int64) error {
	return s.repos.Delete(ctx, id)
}

// List возвращает список пользователей с пагинацией
func (s *UserServiceImpl) List(ctx context.Context, page, size int) ([]*domain.User, int, error) {
	users, err := s.repos.List(ctx, page, size)
	if err != nil {
		return nil, 0, err
	}

	totalCount, err := s.repos.Count(ctx)
	if err != nil {
		return nil, 0, err
	}

	return users, totalCount, nil
}
