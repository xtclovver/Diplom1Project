package service

import (
	"context"
	"fmt"
	"log"
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
	log.Printf("[AuthService] Попытка регистрации пользователя: %s, email: %s", username, email)

	// Проверяем, не существует ли уже пользователь с таким именем
	existingUser, err := s.repos.GetByUsername(ctx, username)
	if err == nil && existingUser != nil {
		log.Printf("[AuthService] Пользователь с именем %s уже существует", username)
		return 0, fmt.Errorf("пользователь с таким именем уже существует")
	}

	// Проверяем, не существует ли пользователь с таким email
	existingUser, err = s.repos.GetByEmail(ctx, email)
	if err == nil && existingUser != nil {
		log.Printf("[AuthService] Пользователь с email %s уже существует", email)
		return 0, fmt.Errorf("пользователь с таким email уже существует")
	}

	// Хеширование пароля
	hashedPassword, err := auth.HashPassword(password)
	if err != nil {
		log.Printf("[AuthService] Ошибка хеширования пароля: %v", err)
		return 0, err
	}

	log.Printf("[AuthService] Создание пользователя с хешем пароля длиной: %d", len(hashedPassword))

	user := &domain.User{
		Username: username,
		Email:    email,
		Password: hashedPassword,
		FullName: fullName,
		Phone:    phone,
		RoleID:   2, // Предполагается, что ID роли обычного пользователя = 2
	}

	id, err := s.repos.Create(ctx, user)
	if err != nil {
		log.Printf("[AuthService] Ошибка создания пользователя: %v", err)
		return 0, err
	}

	log.Printf("[AuthService] Пользователь успешно создан: %s (ID: %d)", username, id)
	return id, nil
}

// Login аутентифицирует пользователя и выдает токены
func (s *AuthServiceImpl) Login(ctx context.Context, usernameOrEmail, password string) (string, string, error) {
	log.Printf("[AuthService] Вызов Login для пользователя: %s", usernameOrEmail)

	var user *domain.User
	var err error

	// Определяем, что нам передали: имя пользователя или email
	if strings.Contains(usernameOrEmail, "@") {
		// Если в строке есть символ @, считаем что это email
		log.Printf("[AuthService] Поиск пользователя по email: %s", usernameOrEmail)
		user, err = s.repos.GetByEmail(ctx, usernameOrEmail)
	} else {
		// Иначе считаем, что это имя пользователя
		log.Printf("[AuthService] Поиск пользователя по username: %s", usernameOrEmail)
		user, err = s.repos.GetByUsername(ctx, usernameOrEmail)
	}

	if err != nil {
		log.Printf("[AuthService] Ошибка поиска пользователя: %v", err)
		return "", "", ErrInvalidCredentials
	}

	if user == nil {
		log.Printf("[AuthService] Пользователь не найден: %s", usernameOrEmail)
		return "", "", ErrInvalidCredentials
	}

	// Безопасно выводим часть хеша пароля
	passwordPreview := "пустой"
	if len(user.Password) > 0 {
		if len(user.Password) > 10 {
			passwordPreview = user.Password[:10] + "..."
		} else {
			passwordPreview = user.Password
		}
	}

	log.Printf("[AuthService] Пользователь найден: ID=%d, Username=%s, PasswordHash=%s",
		user.ID, user.Username, passwordPreview)

	// Проверяем пароль
	if !auth.CheckPassword(password, user.Password) {
		log.Printf("[AuthService] Неверный пароль для пользователя: %s (длина введенного пароля: %d)",
			usernameOrEmail, len(password))
		return "", "", ErrInvalidCredentials
	}

	log.Printf("[AuthService] Успешная аутентификация пользователя: %s (ID: %d)", usernameOrEmail, user.ID)

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

	log.Printf("[AuthService] Роль пользователя: %s", roleName)

	// Генерируем access token
	accessToken, err := s.tokenManager.GenerateAccessToken(user.ID, roleName)
	if err != nil {
		log.Printf("[AuthService] Ошибка генерации access token: %v", err)
		return "", "", err
	}

	// Генерируем refresh token
	refreshToken, err := s.tokenManager.GenerateRefreshToken(user.ID)
	if err != nil {
		log.Printf("[AuthService] Ошибка генерации refresh token: %v", err)
		return "", "", err
	}

	log.Printf("[AuthService] Токены успешно сгенерированы для пользователя: %s", usernameOrEmail)
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
	log.Println("[AuthService] Вызов RefreshToken")

	// Парсим refresh токен
	log.Println("[AuthService] Парсинг refresh токена")
	claims, err := s.tokenManager.ParseToken(refreshToken)
	if err != nil {
		log.Printf("[AuthService] Ошибка парсинга токена: %v", err)
		return "", "", err
	}

	log.Printf("[AuthService] Токен успешно распарсен, userID: %d", claims.UserID)

	// Получаем пользователя из БД
	log.Printf("[AuthService] Получение пользователя по ID: %d", claims.UserID)
	user, err := s.repos.GetByID(ctx, claims.UserID)
	if err != nil {
		log.Printf("[AuthService] Ошибка получения пользователя: %v", err)
		return "", "", err
	}

	log.Printf("[AuthService] Пользователь найден: %s (ID: %d)", user.Username, user.ID)

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

	log.Printf("[AuthService] Роль пользователя: %s", roleName)

	// Генерируем новый access token
	log.Println("[AuthService] Генерация нового access token")
	newAccessToken, err := s.tokenManager.GenerateAccessToken(user.ID, roleName)
	if err != nil {
		log.Printf("[AuthService] Ошибка генерации access token: %v", err)
		return "", "", err
	}

	// Генерируем новый refresh token
	log.Println("[AuthService] Генерация нового refresh token")
	newRefreshToken, err := s.tokenManager.GenerateRefreshToken(user.ID)
	if err != nil {
		log.Printf("[AuthService] Ошибка генерации refresh token: %v", err)
		return "", "", err
	}

	log.Println("[AuthService] Токены успешно обновлены")
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
