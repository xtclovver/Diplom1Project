package service

import (
	"context"
	"fmt"

	"github.com/usedcvnt/Diplom1Project/backend/internal/domain"
	"github.com/usedcvnt/Diplom1Project/backend/internal/repository"
)

// userService реализация UserService
type userService struct {
	userRepo repository.UserRepository
}

// NewUserService создает новый экземпляр UserService
func NewUserService(userRepo repository.UserRepository) UserService {
	return &userService{
		userRepo: userRepo,
	}
}

// Create создает нового пользователя
func (s *userService) Create(ctx context.Context, user *domain.User) (int64, error) {
	// Проверяем, что пользователь с таким username или email еще не существует
	existingByUsername, _ := s.userRepo.GetByUsername(ctx, user.Username)
	if existingByUsername != nil {
		return 0, fmt.Errorf("пользователь с именем %s уже существует", user.Username)
	}

	existingByEmail, _ := s.userRepo.GetByEmail(ctx, user.Email)
	if existingByEmail != nil {
		return 0, fmt.Errorf("пользователь с email %s уже существует", user.Email)
	}

	// Создаем пользователя
	return s.userRepo.Create(ctx, user)
}

// GetByID получает пользователя по ID
func (s *userService) GetByID(ctx context.Context, id int64) (*domain.User, error) {
	return s.userRepo.GetByID(ctx, id)
}

// Update обновляет данные пользователя
func (s *userService) Update(ctx context.Context, user *domain.User) error {
	// Проверяем существование пользователя
	existingUser, err := s.userRepo.GetByID(ctx, user.ID)
	if err != nil {
		return err
	}

	// Проверяем, не занят ли новый username или email другим пользователем
	if user.Username != existingUser.Username {
		existingByUsername, _ := s.userRepo.GetByUsername(ctx, user.Username)
		if existingByUsername != nil && existingByUsername.ID != user.ID {
			return fmt.Errorf("пользователь с именем %s уже существует", user.Username)
		}
	}

	if user.Email != existingUser.Email {
		existingByEmail, _ := s.userRepo.GetByEmail(ctx, user.Email)
		if existingByEmail != nil && existingByEmail.ID != user.ID {
			return fmt.Errorf("пользователь с email %s уже существует", user.Email)
		}
	}

	// Обновляем пользователя
	return s.userRepo.Update(ctx, user)
}

// Delete удаляет пользователя
func (s *userService) Delete(ctx context.Context, id int64) error {
	// Проверяем существование пользователя
	_, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	// Удаляем пользователя
	return s.userRepo.Delete(ctx, id)
}

// List возвращает список пользователей с пагинацией
func (s *userService) List(ctx context.Context, page, size int) ([]*domain.User, int, error) {
	offset := (page - 1) * size

	// Получаем пользователей
	users, err := s.userRepo.List(ctx, offset, size)
	if err != nil {
		return nil, 0, err
	}

	// Получаем общее количество пользователей
	total, err := s.userRepo.Count(ctx)
	if err != nil {
		return nil, 0, err
	}

	return users, total, nil
}
