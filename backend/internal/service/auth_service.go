package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/usedcvnt/Diplom1Project/backend/internal/domain"
	"github.com/usedcvnt/Diplom1Project/backend/internal/repository"
	"github.com/usedcvnt/Diplom1Project/backend/pkg/auth"
	"golang.org/x/crypto/bcrypt"
)

const (
	// UserRoleID ID роли "пользователь"
	UserRoleID = 2
)

// authService реализация AuthService
type authService struct {
	userRepo     repository.UserRepository
	tokenManager auth.TokenManager
}

// NewAuthService создает новый экземпляр AuthService
func NewAuthService(userRepo repository.UserRepository, tokenManager auth.TokenManager) AuthService {
	return &authService{
		userRepo:     userRepo,
		tokenManager: tokenManager,
	}
}

// Register регистрирует нового пользователя
func (s *authService) Register(ctx context.Context, username, email, password, fullName, phone string) (int64, error) {
	// Проверяем, что пользователь с таким username или email еще не существует
	existingByUsername, _ := s.userRepo.GetByUsername(ctx, username)
	if existingByUsername != nil {
		return 0, fmt.Errorf("пользователь с именем %s уже существует", username)
	}

	existingByEmail, _ := s.userRepo.GetByEmail(ctx, email)
	if existingByEmail != nil {
		return 0, fmt.Errorf("пользователь с email %s уже существует", email)
	}

	// Хешируем пароль
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return 0, fmt.Errorf("не удалось хешировать пароль: %w", err)
	}

	// Создаем пользователя
	user := &domain.User{
		Username:  username,
		Password:  string(hashedPassword),
		Email:     email,
		FullName:  fullName,
		Phone:     phone,
		RoleID:    UserRoleID, // Роль "пользователь" по умолчанию
		CreatedAt: time.Now(),
	}

	return s.userRepo.Create(ctx, user)
}

// Login аутентифицирует пользователя и возвращает токены
func (s *authService) Login(ctx context.Context, usernameOrEmail, password string) (string, string, error) {
	// Пробуем найти пользователя по username
	user, err := s.userRepo.GetByUsername(ctx, usernameOrEmail)
	if err != nil {
		// Если не нашли по username, пробуем по email
		user, err = s.userRepo.GetByEmail(ctx, usernameOrEmail)
		if err != nil {
			return "", "", fmt.Errorf("неверное имя пользователя или email")
		}
	}

	// Проверяем пароль
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return "", "", fmt.Errorf("неверный пароль")
	}

	// Получаем роль пользователя (для простоты используем строковое представление ID роли)
	role := fmt.Sprintf("%d", user.RoleID)

	// Генерируем токены
	accessToken, err := s.tokenManager.GenerateAccessToken(user.ID, role)
	if err != nil {
		return "", "", fmt.Errorf("не удалось создать access токен: %w", err)
	}

	refreshToken, err := s.tokenManager.GenerateRefreshToken(user.ID)
	if err != nil {
		return "", "", fmt.Errorf("не удалось создать refresh токен: %w", err)
	}

	return accessToken, refreshToken, nil
}

// ValidateToken проверяет токен и возвращает данные пользователя
func (s *authService) ValidateToken(ctx context.Context, token string) (*domain.User, error) {
	// Проверяем токен
	claims, err := s.tokenManager.ParseToken(token)
	if err != nil {
		return nil, fmt.Errorf("недействительный токен: %w", err)
	}

	// Получаем пользователя по ID из токена
	user, err := s.userRepo.GetByID(ctx, claims.UserID)
	if err != nil {
		return nil, fmt.Errorf("пользователь не найден: %w", err)
	}

	return user, nil
}

// RefreshToken обновляет пару токенов с использованием refresh токена
func (s *authService) RefreshToken(ctx context.Context, refreshToken string) (string, string, error) {
	// Проверяем refresh токен
	claims, err := s.tokenManager.ParseToken(refreshToken)
	if err != nil {
		return "", "", fmt.Errorf("недействительный refresh токен: %w", err)
	}

	// Получаем пользователя по ID из токена
	user, err := s.userRepo.GetByID(ctx, claims.UserID)
	if err != nil {
		return "", "", fmt.Errorf("пользователь не найден: %w", err)
	}

	// Генерируем новые токены
	role := fmt.Sprintf("%d", user.RoleID)

	newAccessToken, err := s.tokenManager.GenerateAccessToken(user.ID, role)
	if err != nil {
		return "", "", fmt.Errorf("не удалось создать access токен: %w", err)
	}

	newRefreshToken, err := s.tokenManager.GenerateRefreshToken(user.ID)
	if err != nil {
		return "", "", fmt.Errorf("не удалось создать refresh токен: %w", err)
	}

	return newAccessToken, newRefreshToken, nil
}

// ChangePassword изменяет пароль пользователя
func (s *authService) ChangePassword(ctx context.Context, userID int64, oldPassword, newPassword string) error {
	// Получаем пользователя
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("пользователь не найден: %w", err)
	}

	// Проверяем старый пароль
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(oldPassword))
	if err != nil {
		return errors.New("неверный текущий пароль")
	}

	// Хешируем новый пароль
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("не удалось хешировать пароль: %w", err)
	}

	// Обновляем пароль пользователя
	user.Password = string(hashedPassword)
	return s.userRepo.Update(ctx, user)
}
