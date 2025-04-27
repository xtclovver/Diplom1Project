package service

import (
	"context"

	"github.com/usedcvnt/Diplom1Project/backend/internal/domain"
	"github.com/usedcvnt/Diplom1Project/backend/internal/repository"
	"github.com/usedcvnt/Diplom1Project/backend/pkg/auth"
)

// AuthServiceImpl реализация сервиса аутентификации
type AuthServiceImpl struct {
	repos        repository.UserRepository
	tokenManager auth.TokenManager
}

// NewAuthService создает новый сервис аутентификации
func NewAuthService(repos repository.UserRepository, tokenManager auth.TokenManager) AuthService {
	return &AuthServiceImpl{
		repos:        repos,
		tokenManager: tokenManager,
	}
}

// Register регистрирует нового пользователя
func (s *AuthServiceImpl) Register(ctx context.Context, username, email, password, fullName, phone string) (int64, error) {
	user := &domain.User{
		Username: username,
		Email:    email,
		FullName: fullName,
		Phone:    phone,
		RoleID:   2, // Предполагается, что ID роли обычного пользователя = 2
	}

	// Хеширование пароля будет реализовано здесь

	return s.repos.Create(ctx, user)
}

// Login аутентифицирует пользователя и выдает токены
func (s *AuthServiceImpl) Login(ctx context.Context, usernameOrEmail, password string) (string, string, error) {
	// Поиск пользователя по username или email
	// Проверка пароля
	// Генерация токенов доступа и обновления

	return "access_token", "refresh_token", nil
}

// ValidateToken проверяет токен и возвращает пользователя
func (s *AuthServiceImpl) ValidateToken(ctx context.Context, token string) (*domain.User, error) {
	// Проверка токена и получение ID пользователя
	// Получение пользователя из БД

	return &domain.User{}, nil
}

// RefreshToken обновляет токены доступа
func (s *AuthServiceImpl) RefreshToken(ctx context.Context, refreshToken string) (string, string, error) {
	// Проверка refresh токена
	// Генерация новых токенов

	return "new_access_token", "new_refresh_token", nil
}

// ChangePassword изменяет пароль пользователя
func (s *AuthServiceImpl) ChangePassword(ctx context.Context, userID int64, oldPassword, newPassword string) error {
	// Проверка старого пароля
	// Хеширование и сохранение нового пароля

	return nil
}
