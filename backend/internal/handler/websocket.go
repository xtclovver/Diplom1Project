package handler

import (
	"context"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	gw "github.com/gorilla/websocket"
	"github.com/usedcvnt/Diplom1Project/backend/internal/domain"
	pkgwebsocket "github.com/usedcvnt/Diplom1Project/backend/pkg/websocket"
)

var (
	// Конфигурация для апгрейда HTTP-соединения до WebSocket
	upgrader = gw.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return true // В продакшене нужно проверять Origin
		},
	}

	// Центральный хаб для управления всеми WebSocket-соединениями
	wsHub *pkgwebsocket.Hub
)

// InitWebSocketHub инициализирует WebSocket-хаб
func InitWebSocketHub() {
	wsHub = pkgwebsocket.NewHub()
	go wsHub.Run()
}

// wsTicketChat обработчик для WebSocket-соединения чата тикета
func (h *Handler) wsTicketChat(c *gin.Context) {
	// Получаем ID тикета из URL
	ticketIDStr := c.Param("ticketId")
	ticketID, err := strconv.ParseInt(ticketIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID тикета"})
		return
	}

	// Получаем пользователя из контекста
	userRaw, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Требуется авторизация"})
		return
	}
	user := userRaw.(*domain.User)

	// Проверяем права доступа к тикету
	if user.RoleID != AdminRoleID && user.RoleID != SupportRoleID {
		// Если это обычный пользователь, проверяем, принадлежит ли ему тикет
		ticket, err := h.services.SupportTicket.GetByID(c.Request.Context(), ticketID)
		if err != nil || ticket.UserID != user.ID {
			c.JSON(http.StatusForbidden, gin.H{"error": "У вас нет доступа к этому тикету"})
			return
		}
	}

	// Апгрейд HTTP-соединения до WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		fmt.Printf("Ошибка при апгрейде соединения: %v\n", err)
		return
	}

	// Создаем клиента
	client := &pkgwebsocket.Client{
		Hub:      wsHub,
		Conn:     conn,
		Send:     make(chan pkgwebsocket.Message, 256),
		TicketID: ticketID,
		UserID:   user.ID,
	}

	// Регистрируем клиента в хабе
	client.Hub.Register <- client

	// Запускаем горутины для чтения и записи сообщений
	go client.WritePump()
	go client.ReadPump()

	// Отправляем историю сообщений
	messages, err := h.services.SupportTicket.GetMessages(c.Request.Context(), ticketID)
	if err == nil {
		for _, msg := range messages {
			sender, _ := h.services.User.GetByID(c.Request.Context(), msg.UserID)
			var senderName string
			if sender != nil {
				senderName = sender.Username
			} else {
				senderName = "Неизвестный пользователь"
			}

			client.Send <- pkgwebsocket.Message{
				Type: "history",
				Content: map[string]interface{}{
					"id":        msg.ID,
					"sender":    senderName,
					"senderId":  msg.UserID,
					"message":   msg.Message,
					"timestamp": msg.CreatedAt,
				},
			}
		}
	}
}

// handleTicketMessage обрабатывает новое сообщение из WebSocket и сохраняет его в базе данных
func (h *Handler) handleTicketMessage(message pkgwebsocket.Message, ticketID, userID int64) {
	// Проверяем, что это сообщение чата
	if message.Type != "chat" {
		return
	}

	// Получаем содержимое сообщения
	content, ok := message.Content.(map[string]interface{})
	if !ok {
		return
	}

	messageText, ok := content["message"].(string)
	if !ok || messageText == "" {
		return
	}

	// Сохраняем сообщение в базе данных
	_, err := h.services.SupportTicket.AddMessage(context.Background(), ticketID, userID, messageText)
	if err != nil {
		// Обработка ошибки сохранения сообщения
		fmt.Printf("Ошибка сохранения сообщения в БД: %v\n", err)
		// Возможно, стоит отправить сообщение об ошибке обратно клиенту или залогировать
	}
}
