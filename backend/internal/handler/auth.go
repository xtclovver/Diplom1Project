package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// loginInput данные для аутентификации
type loginInput struct {
	UsernameOrEmail string `json:"usernameOrEmail" binding:"required"`
	Password        string `json:"password" binding:"required"`
}

// registerInput данные для регистрации
type registerInput struct {
	Username string `json:"username" binding:"required,min=3,max=30"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	FullName string `json:"fullName" binding:"required"`
	Phone    string `json:"phone" binding:"required"`
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
	var input registerInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректные данные: " + err.Error()})
		return
	}

	id, err := h.services.Auth.Register(
		c.Request.Context(),
		input.Username,
		input.Email,
		input.Password,
		input.FullName,
		input.Phone,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id})
}

// login обработчик аутентификации
func (h *Handler) login(c *gin.Context) {
	var input loginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректные данные: " + err.Error()})
		return
	}

	accessToken, refreshToken, err := h.services.Auth.Login(
		c.Request.Context(),
		input.UsernameOrEmail,
		input.Password,
	)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	})
}

// refreshToken обработчик обновления токенов
func (h *Handler) refreshToken(c *gin.Context) {
	var input refreshInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректные данные: " + err.Error()})
		return
	}

	accessToken, refreshToken, err := h.services.Auth.RefreshToken(
		c.Request.Context(),
		input.RefreshToken,
	)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	})
}
