package auth

import (
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/usedcvnt/Diplom1Project/backend/internal/config"
)

// TokenClaims структура для хранения данных в JWT токене
type TokenClaims struct {
	UserID int64  `json:"user_id"`
	Role   string `json:"role"`
	jwt.StandardClaims
}

// TokenManager интерфейс для работы с JWT токенами
type TokenManager interface {
	GenerateAccessToken(userID int64, role string) (string, error)
	GenerateRefreshToken(userID int64) (string, error)
	ParseToken(token string) (*TokenClaims, error)
}

// JWTManager реализация TokenManager с использованием JWT
type JWTManager struct {
	signingKey      string
	accessTokenTTL  time.Duration
	refreshTokenTTL time.Duration
}

// NewJWTManager создает новый экземпляр JWTManager
func NewJWTManager(cfg config.JWTConfig) *JWTManager {
	return &JWTManager{
		signingKey:      cfg.Secret,
		accessTokenTTL:  time.Duration(cfg.AccessExpiration) * time.Minute,
		refreshTokenTTL: time.Duration(cfg.RefreshExpiration) * time.Hour,
	}
}

// GenerateAccessToken генерирует JWT access токен
func (m *JWTManager) GenerateAccessToken(userID int64, role string) (string, error) {
	claims := TokenClaims{
		UserID: userID,
		Role:   role,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Add(m.accessTokenTTL).Unix(),
			IssuedAt:  time.Now().Unix(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(m.signingKey))
}

// GenerateRefreshToken генерирует JWT refresh токен
func (m *JWTManager) GenerateRefreshToken(userID int64) (string, error) {
	log.Printf("[JWT] Генерация refresh токена для пользователя ID: %d", userID)

	claims := TokenClaims{
		UserID: userID,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Add(m.refreshTokenTTL).Unix(),
			IssuedAt:  time.Now().Unix(),
		},
	}

	expiresAt := time.Unix(claims.ExpiresAt, 0)
	log.Printf("[JWT] Refresh токен истекает: %v (через %v)", expiresAt, m.refreshTokenTTL)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(m.signingKey))

	if err != nil {
		log.Printf("[JWT] Ошибка подписи refresh токена: %v", err)
		return "", err
	}

	log.Printf("[JWT] Refresh токен успешно создан, длина: %d", len(tokenString))
	return tokenString, nil
}

// ParseToken разбирает JWT токен и возвращает данные из него
func (m *JWTManager) ParseToken(tokenString string) (*TokenClaims, error) {
	// Проверяем, что токен не пустой
	if tokenString == "" {
		log.Println("[JWT] Получен пустой токен")
		return nil, errors.New("пустой токен")
	}

	log.Printf("[JWT] Парсинг токена длиной: %d", len(tokenString))

	token, err := jwt.ParseWithClaims(tokenString, &TokenClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			log.Printf("[JWT] Неожиданный метод подписи: %v", token.Header["alg"])
			return nil, fmt.Errorf("неожиданный метод подписи: %v", token.Header["alg"])
		}
		return []byte(m.signingKey), nil
	})

	if err != nil {
		log.Printf("[JWT] Ошибка парсинга токена: %v", err)
		return nil, err
	}

	claims, ok := token.Claims.(*TokenClaims)
	if !ok {
		log.Println("[JWT] Не удалось получить данные из токена")
		return nil, errors.New("не удалось получить данные из токена")
	}

	// Проверяем валидность токена
	if !token.Valid {
		log.Println("[JWT] Токен недействителен")
		return nil, errors.New("недействительный токен")
	}

	// Проверяем, что токен не истек
	now := time.Now().Unix()
	if claims.ExpiresAt < now {
		log.Printf("[JWT] Токен истек: expiresAt=%d, now=%d", claims.ExpiresAt, now)
		return nil, errors.New("токен истек")
	}

	expiresAt := time.Unix(claims.ExpiresAt, 0)
	log.Printf("[JWT] Токен действителен до: %v (осталось %v)",
		expiresAt,
		time.Until(expiresAt))
	log.Printf("[JWT] Токен принадлежит пользователю ID: %d", claims.UserID)

	return claims, nil
}
