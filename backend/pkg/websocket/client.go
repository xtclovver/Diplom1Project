package websocket

import (
	"log"
	"time"

	"github.com/gorilla/websocket"
)

const (
	// Время для записи сообщения клиенту
	writeWait = 10 * time.Second

	// Время для чтения следующего pong сообщения от клиента
	pongWait = 60 * time.Second

	// Отправлять ping клиенту с этой периодичностью
	pingPeriod = (pongWait * 9) / 10

	// Максимальный размер сообщения от клиента
	maxMessageSize = 512
)

// Message структура сообщения
type Message struct {
	Type    string      `json:"type"`
	Content interface{} `json:"content"`
}

// Client представляет клиента WebSocket
type Client struct {
	Hub      *Hub
	Conn     *websocket.Conn
	Send     chan Message
	TicketID int64
	UserID   int64
}

// ReadPump обрабатывает сообщения от клиента
func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(maxMessageSize)
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		var msg Message
		err := c.Conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		// Добавляем сообщение в хаб
		c.Hub.Broadcast <- BroadcastMessage{
			Message:  msg,
			TicketID: c.TicketID,
		}
	}
}

// WritePump отправляет сообщения клиенту
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// Хаб закрыл канал
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			err := c.Conn.WriteJSON(message)
			if err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
