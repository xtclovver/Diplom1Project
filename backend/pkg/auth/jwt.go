package auth

import (
	"errors"
	"fmt"
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
	claims := TokenClaims{
		UserID: userID,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Add(m.refreshTokenTTL).Unix(),
			IssuedAt:  time.Now().Unix(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(m.signingKey))
}

// ParseToken разбирает JWT токен и возвращает данные из него
func (m *JWTManager) ParseToken(tokenString string) (*TokenClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &TokenClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("неожиданный метод подписи: %v", token.Header["alg"])
		}
		return []byte(m.signingKey), nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*TokenClaims)
	if !ok {
		return nil, errors.New("не удалось получить данные из токена")
	}

	return claims, nil
}
