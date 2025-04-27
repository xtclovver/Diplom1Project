package websocket

// BroadcastMessage структура для широковещательного сообщения
type BroadcastMessage struct {
	Message  Message
	TicketID int64
}

// Hub центральный компонент для управления всеми клиентами WebSocket
type Hub struct {
	// Зарегистрированные клиенты, сгруппированные по ID тикета
	Clients map[int64]map[*Client]bool

	// Входящие сообщения от клиентов
	Broadcast chan BroadcastMessage

	// Регистрация клиентов
	Register chan *Client

	// Отмена регистрации клиентов
	Unregister chan *Client
}

// NewHub создает новый Hub
func NewHub() *Hub {
	return &Hub{
		Broadcast:  make(chan BroadcastMessage),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Clients:    make(map[int64]map[*Client]bool),
	}
}

// Run запускает Hub
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			// Создаем карту клиентов для тикета, если еще не существует
			if _, ok := h.Clients[client.TicketID]; !ok {
				h.Clients[client.TicketID] = make(map[*Client]bool)
			}
			// Регистрируем клиента
			h.Clients[client.TicketID][client] = true

		case client := <-h.Unregister:
			// Удаляем клиента, если он зарегистрирован
			if _, ok := h.Clients[client.TicketID]; ok {
				if _, ok := h.Clients[client.TicketID][client]; ok {
					delete(h.Clients[client.TicketID], client)
					close(client.Send)

					// Если клиентов для тикета больше нет, удаляем карту
					if len(h.Clients[client.TicketID]) == 0 {
						delete(h.Clients, client.TicketID)
					}
				}
			}

		case message := <-h.Broadcast:
			// Отправляем сообщение всем клиентам, связанным с данным тикетом
			if clients, ok := h.Clients[message.TicketID]; ok {
				for client := range clients {
					select {
					case client.Send <- message.Message:
					default:
						close(client.Send)
						delete(clients, client)
					}
				}
			}
		}
	}
}
