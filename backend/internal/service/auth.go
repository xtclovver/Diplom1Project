package service

import (
	"context"
	"strings"

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
	// Хеширование пароля
	hashedPassword, err := auth.HashPassword(password)
	if err != nil {
		return 0, err
	}

	user := &domain.User{
		Username: username,
		Email:    email,
		Password: hashedPassword,
		FullName: fullName,
		Phone:    phone,
		RoleID:   2, // Предполагается, что ID роли обычного пользователя = 2
	}

	return s.repos.Create(ctx, user)
}

// Login аутентифицирует пользователя и выдает токены
func (s *AuthServiceImpl) Login(ctx context.Context, usernameOrEmail, password string) (string, string, error) {
	var user *domain.User
	var err error

	// Определяем, что нам передали: имя пользователя или email
	if strings.Contains(usernameOrEmail, "@") {
		// Если в строке есть символ @, считаем что это email
		user, err = s.repos.GetByEmail(ctx, usernameOrEmail)
	} else {
		// Иначе считаем, что это имя пользователя
		user, err = s.repos.GetByUsername(ctx, usernameOrEmail)
	}

	if err != nil {
		return "", "", ErrInvalidCredentials
	}

	// Проверяем пароль
	if !auth.CheckPassword(password, user.Password) {
		return "", "", ErrInvalidCredentials
	}

	// Определяем роль пользователя для токена
	var roleName string
	switch user.RoleID {
	case 1:
		roleName = "admin"
	case 2:
		roleName = "user"
	case 3:
		roleName = "support"
	default:
		roleName = "user"
	}

	// Генерируем access token
	accessToken, err := s.tokenManager.GenerateAccessToken(user.ID, roleName)
	if err != nil {
		return "", "", err
	}

	// Генерируем refresh token
	refreshToken, err := s.tokenManager.GenerateRefreshToken(user.ID)
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

// ValidateToken проверяет токен и возвращает пользователя
func (s *AuthServiceImpl) ValidateToken(ctx context.Context, token string) (*domain.User, error) {
	// Парсим токен
	claims, err := s.tokenManager.ParseToken(token)
	if err != nil {
		return nil, err
	}

	// Получаем пользователя из БД
	user, err := s.repos.GetByID(ctx, claims.UserID)
	if err != nil {
		return nil, err
	}

	return user, nil
}

// RefreshToken обновляет токены доступа
func (s *AuthServiceImpl) RefreshToken(ctx context.Context, refreshToken string) (string, string, error) {
	// Парсим refresh токен
	claims, err := s.tokenManager.ParseToken(refreshToken)
	if err != nil {
		return "", "", err
	}

	// Получаем пользователя из БД
	user, err := s.repos.GetByID(ctx, claims.UserID)
	if err != nil {
		return "", "", err
	}

	// Определяем роль пользователя для токена
	var roleName string
	switch user.RoleID {
	case 1:
		roleName = "admin"
	case 2:
		roleName = "user"
	case 3:
		roleName = "support"
	default:
		roleName = "user"
	}

	// Генерируем новый access token
	newAccessToken, err := s.tokenManager.GenerateAccessToken(user.ID, roleName)
	if err != nil {
		return "", "", err
	}

	// Генерируем новый refresh token
	newRefreshToken, err := s.tokenManager.GenerateRefreshToken(user.ID)
	if err != nil {
		return "", "", err
	}

	return newAccessToken, newRefreshToken, nil
}

// ChangePassword изменяет пароль пользователя
func (s *AuthServiceImpl) ChangePassword(ctx context.Context, userID int64, oldPassword, newPassword string) error {
	// Получаем пользователя из БД
	user, err := s.repos.GetByID(ctx, userID)
	if err != nil {
		return err
	}

	// Проверяем старый пароль
	if !auth.CheckPassword(oldPassword, user.Password) {
		return ErrInvalidCredentials
	}

	// Хешируем новый пароль
	hashedPassword, err := auth.HashPassword(newPassword)
	if err != nil {
		return err
	}

	// Обновляем пароль в базе данных
	user.Password = hashedPassword
	return s.repos.Update(ctx, user)
}
