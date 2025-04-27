package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/usedcvnt/Diplom1Project/backend/internal/service"
	"github.com/usedcvnt/Diplom1Project/backend/pkg/auth"
)

// Handler структура для обработки HTTP запросов
type Handler struct {
	services     *service.Service
	tokenManager auth.TokenManager
}

// NewHandler создает новый экземпляр Handler
func NewHandler(services *service.Service, tokenManager auth.TokenManager) *Handler {
	return &Handler{
		services:     services,
		tokenManager: tokenManager,
	}
}

// InitRoutes инициализирует маршруты API
func (h *Handler) InitRoutes() *gin.Engine {
	router := gin.New()

	// Middleware для логирования и восстановления после паники
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// Обработка CORS
	router.Use(corsMiddleware())

	// Публичные маршруты API
	api := router.Group("/api")
	{
		// Аутентификация
		auth := api.Group("/auth")
		{
			auth.POST("/register", h.register)
			auth.POST("/login", h.login)
			auth.POST("/refresh", h.refreshToken)
		}

		// Туры (доступны без аутентификации для просмотра)
		tours := api.Group("/tours")
		{
			tours.GET("/", h.getAllTours)
			tours.GET("/:id", h.getTourByID)
			tours.GET("/:id/dates", h.getTourDates)
		}

		// Отели (доступны без аутентификации для просмотра)
		hotels := api.Group("/hotels")
		{
			hotels.GET("/", h.getAllHotels)
			hotels.GET("/:id", h.getHotelByID)
			hotels.GET("/:id/rooms", h.getHotelRooms)
		}

		// Маршруты, требующие аутентификации
		authenticated := api.Group("/")
		authenticated.Use(h.authMiddleware())
		{
			// Пользователи
			users := authenticated.Group("/users")
			{
				users.GET("/me", h.getCurrentUser)
				users.PUT("/me", h.updateCurrentUser)
				users.PUT("/me/password", h.changePassword)
			}

			// Заказы
			orders := authenticated.Group("/orders")
			{
				orders.POST("/", h.createOrder)
				orders.GET("/", h.getUserOrders)
				orders.GET("/:id", h.getOrderByID)
				orders.DELETE("/:id", h.cancelOrder)
			}

			// Тикеты тех-поддержки
			tickets := authenticated.Group("/tickets")
			{
				tickets.POST("/", h.createTicket)
				tickets.GET("/", h.getUserTickets)
				tickets.GET("/:id", h.getTicketByID)
				tickets.POST("/:id/messages", h.addTicketMessage)
				tickets.GET("/:id/messages", h.getTicketMessages)
				tickets.PUT("/:id/close", h.closeTicket)
			}
		}

		// Маршруты для администраторов
		admin := api.Group("/admin")
		admin.Use(h.authMiddleware(), h.adminMiddleware())
		{
			// Управление пользователями
			admin.GET("/users", h.getAllUsers)
			admin.GET("/users/:id", h.getUserByID)
			admin.PUT("/users/:id", h.updateUser)
			admin.DELETE("/users/:id", h.deleteUser)

			// Управление турами
			admin.POST("/tours", h.createTour)
			admin.PUT("/tours/:id", h.updateTour)
			admin.DELETE("/tours/:id", h.deleteTour)
			admin.POST("/tours/:id/dates", h.addTourDate)
			admin.PUT("/tours/:id/dates/:dateId", h.updateTourDate)
			admin.DELETE("/tours/:id/dates/:dateId", h.deleteTourDate)

			// Управление отелями
			admin.POST("/hotels", h.createHotel)
			admin.PUT("/hotels/:id", h.updateHotel)
			admin.DELETE("/hotels/:id", h.deleteHotel)
			admin.POST("/hotels/:id/rooms", h.addRoom)
			admin.PUT("/hotels/:id/rooms/:roomId", h.updateRoom)
			admin.DELETE("/hotels/:id/rooms/:roomId", h.deleteRoom)

			// Управление заказами
			admin.GET("/orders", h.getAllOrders)
			admin.PUT("/orders/:id/status", h.updateOrderStatus)

			// Управление тикетами
			admin.GET("/tickets", h.getAllTickets)
			admin.PUT("/tickets/:id/status", h.updateTicketStatus)
		}

		// Маршруты для тех-поддержки
		support := api.Group("/support")
		support.Use(h.authMiddleware(), h.supportMiddleware())
		{
			support.GET("/tickets", h.getAllTickets)
			support.GET("/tickets/:id", h.getTicketByID)
			support.POST("/tickets/:id/messages", h.addTicketMessage)
			support.GET("/tickets/:id/messages", h.getTicketMessages)
			support.PUT("/tickets/:id/status", h.updateTicketStatus)
		}
	}

	// Обработка WebSocket для чата тех-поддержки
	router.GET("/ws/chat/:ticketId", h.wsTicketChat)

	return router
}

// corsMiddleware настраивает CORS
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
