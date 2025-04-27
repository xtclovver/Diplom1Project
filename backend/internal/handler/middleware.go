package handler

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/usedcvnt/Diplom1Project/backend/internal/domain"
)

const (
	// AdminRoleID ID роли "администратор"
	AdminRoleID = 1
	// UserRoleID ID роли "пользователь"
	UserRoleID = 2
	// SupportRoleID ID роли "тех-поддержка"
	SupportRoleID = 3
)

// authMiddleware middleware для проверки аутентификации
func (h *Handler) authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Получаем заголовок Authorization
		header := c.GetHeader("Authorization")
		if header == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Требуется авторизация"})
			return
		}

		// Проверяем формат заголовка
		headerParts := strings.Split(header, " ")
		if len(headerParts) != 2 || headerParts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Неверный формат токена"})
			return
		}

		// Получаем токен
		token := headerParts[1]

		// Валидируем токен и получаем пользователя
		user, err := h.services.Auth.ValidateToken(c.Request.Context(), token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}

		// Сохраняем пользователя в контексте
		c.Set("user", user)

		c.Next()
	}
}

// adminMiddleware middleware для проверки прав администратора
func (h *Handler) adminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Получаем пользователя из контекста
		userAny, exists := c.Get("user")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Требуется авторизация"})
			return
		}

		// Приводим тип пользователя
		user, ok := userAny.(*domain.User)
		if !ok {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения данных пользователя"})
			return
		}

		// Проверяем, является ли пользователь администратором
		if user.RoleID != AdminRoleID {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Недостаточно прав"})
			return
		}

		c.Next()
	}
}

// supportMiddleware middleware для проверки прав тех-поддержки
func (h *Handler) supportMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Получаем пользователя из контекста
		userAny, exists := c.Get("user")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Требуется авторизация"})
			return
		}

		// Приводим тип пользователя
		user, ok := userAny.(*domain.User)
		if !ok {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения данных пользователя"})
			return
		}

		// Проверяем, является ли пользователь сотрудником тех-поддержки или администратором
		if user.RoleID != SupportRoleID && user.RoleID != AdminRoleID {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Недостаточно прав"})
			return
		}

		c.Next()
	}
}
