package handler

import (
	"bytes"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// loginInput данные для аутентификации
type loginInput struct {
	UsernameOrEmail string `json:"usernameOrEmail" binding:"required"`
	Password        string `json:"password" binding:"required"`
}

// registerInput данные для регистрации
type registerInput struct {
	Username  string `json:"username" binding:"required,min=3,max=30"`
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=6"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	FullName  string `json:"fullName"`
	Phone     string `json:"phone" binding:"required"`
}

// refreshInput данные для обновления токена
type refreshInput struct {
	RefreshToken string `json:"refreshToken" binding:"required"`
}

// tokenResponse ответ с токенами
type tokenResponse struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
}

// register обработчик регистрации
func (h *Handler) register(c *gin.Context) {
	log.Println("[Auth] Получен запрос на register")

	var input registerInput
	if err := c.ShouldBindJSON(&input); err != nil {
		log.Printf("[Auth] Ошибка валидации входных данных: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректные данные: " + err.Error()})
		return
	}

	log.Printf("[Auth] Попытка регистрации пользователя: %s, email: %s", input.Username, input.Email)

	id, err := h.services.Auth.Register(
		c.Request.Context(),
		input.Username,
		input.Email,
		input.Password,
		input.FirstName,
		input.LastName,
		input.FullName,
		input.Phone,
	)
	if err != nil {
		log.Printf("[Auth] Ошибка регистрации: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.Printf("[Auth] Успешная регистрация пользователя: %s (ID: %d)", input.Username, id)
	c.JSON(http.StatusCreated, gin.H{"id": id})
}

// login обработчик аутентификации
func (h *Handler) login(c *gin.Context) {
	log.Println("[Auth] Получен запрос на login")

	var input loginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		log.Printf("[Auth] Ошибка валидации входных данных: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректные данные: " + err.Error()})
		return
	}

	log.Printf("[Auth] Попытка входа для пользователя: %s", input.UsernameOrEmail)

	accessToken, refreshToken, err := h.services.Auth.Login(
		c.Request.Context(),
		input.UsernameOrEmail,
		input.Password,
	)
	if err != nil {
		log.Printf("[Auth] Ошибка аутентификации: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	log.Printf("[Auth] Успешная аутентификация для пользователя: %s", input.UsernameOrEmail)
	c.JSON(http.StatusOK, tokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	})
}

// refreshToken обработчик обновления токенов
func (h *Handler) refreshToken(c *gin.Context) {
	log.Println("[Auth] Получен запрос на обновление токена")

	// Выводим тело запроса
	requestData, err := c.GetRawData()
	if err != nil {
		log.Printf("[Auth] Ошибка чтения тела запроса: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Не удалось прочитать тело запроса"})
		return
	}
	log.Printf("[Auth] Тело запроса: %s", string(requestData))

	// Восстанавливаем тело запроса для дальнейшей обработки
	c.Request.Body = io.NopCloser(bytes.NewBuffer(requestData))

	var input refreshInput
	if err := c.ShouldBindJSON(&input); err != nil {
		log.Printf("[Auth] Ошибка валидации входных данных: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректные данные: " + err.Error()})
		return
	}

	// Проверяем, что refreshToken не пустой
	if input.RefreshToken == "" {
		log.Println("[Auth] Получен пустой refreshToken")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Refresh token не может быть пустым"})
		return
	}

	// Безопасно выводим первые символы токена
	tokenPreview := input.RefreshToken
	if len(tokenPreview) > 10 {
		tokenPreview = tokenPreview[:10] + "..."
	}
	log.Printf("[Auth] Попытка обновления токена: %s (длина: %d)",
		tokenPreview, len(input.RefreshToken))

	accessToken, refreshToken, err := h.services.Auth.RefreshToken(
		c.Request.Context(),
		input.RefreshToken,
	)
	if err != nil {
		log.Printf("[Auth] Ошибка обновления токена: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	log.Println("[Auth] Успешное обновление токена")
	c.JSON(http.StatusOK, tokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	})
}

// authDiagnostic диагностика системы авторизации
func (h *Handler) authDiagnostic(c *gin.Context) {
	log.Println("[Auth] Запрос диагностики системы авторизации")

	// Формируем ответ
	c.JSON(http.StatusOK, gin.H{
		"status":        "OK",
		"timestamp":     time.Now().Format(time.RFC3339),
		"authServiceOK": h.services != nil && h.services.Auth != nil,
	})
}
