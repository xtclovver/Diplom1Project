package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/usedcvnt/Diplom1Project/backend/internal/domain"
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
			auth.GET("/diagnostic", h.authDiagnostic) // Диагностический эндпоинт
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

// @Summary Get all tours
// @Description Get a list of all tours with optional filters
// @Tags tours
// @Accept json
// @Produce json
// @Param city_id query int false "Filter by city ID"
// @Param country_id query int false "Filter by country ID"
// @Param price_min query number false "Minimum price filter"
// @Param price_max query number false "Maximum price filter"
// @Param page query int false "Page number" default(1)
// @Param size query int false "Page size" default(10)
// @Success 200 {object} map[string]interface{} "List of tours and total count"
// @Failure 400 {object} ErrorResponse "Invalid query parameters"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/tours [get]
func (h *Handler) getAllTours(c *gin.Context) {
	filters := make(map[string]interface{})
	if cityIDStr := c.Query("city_id"); cityIDStr != "" {
		cityID, err := strconv.Atoi(cityIDStr)
		if err != nil {
			newErrorResponse(c, http.StatusBadRequest, "invalid city_id parameter")
			return
		}
		filters["city_id"] = cityID
	}
	if countryIDStr := c.Query("country_id"); countryIDStr != "" {
		countryID, err := strconv.Atoi(countryIDStr)
		if err != nil {
			newErrorResponse(c, http.StatusBadRequest, "invalid country_id parameter")
			return
		}
		filters["country_id"] = countryID // Предполагаем, что сервис может фильтровать по стране
	}
	if priceMinStr := c.Query("price_min"); priceMinStr != "" {
		priceMin, err := strconv.ParseFloat(priceMinStr, 64)
		if err != nil {
			newErrorResponse(c, http.StatusBadRequest, "invalid price_min parameter")
			return
		}
		filters["price_min"] = priceMin
	}
	if priceMaxStr := c.Query("price_max"); priceMaxStr != "" {
		priceMax, err := strconv.ParseFloat(priceMaxStr, 64)
		if err != nil {
			newErrorResponse(c, http.StatusBadRequest, "invalid price_max parameter")
			return
		}
		filters["price_max"] = priceMax
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))

	tours, total, err := h.services.Tour.List(c.Request.Context(), filters, page, size)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Обогащаем туры информацией о местоположении
	for _, tour := range tours {
		// Получаем информацию о городе
		city, err := h.services.City.GetByID(c.Request.Context(), tour.CityID)
		if err == nil && city != nil {
			tour.City = city.Name

			// Получаем информацию о стране
			country, err := h.services.Country.GetByID(c.Request.Context(), city.CountryID)
			if err == nil && country != nil {
				tour.Country = country.Name
				tour.Location = country.Name + ", " + city.Name
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"tours": tours,
		"total": total,
	})
}

// @Summary Get tour by ID
// @Description Get details of a specific tour by its ID
// @Tags tours
// @Accept json
// @Produce json
// @Param id path int true "Tour ID"
// @Success 200 {object} domain.Tour
// @Failure 400 {object} ErrorResponse "Invalid tour ID"
// @Failure 404 {object} ErrorResponse "Tour not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/tours/{id} [get]
func (h *Handler) getTourByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid tour ID")
		return
	}

	tour, err := h.services.Tour.GetByID(c.Request.Context(), id)
	if err != nil {
		// TODO: Различать ошибку "не найдено" и другие ошибки сервиса
		newErrorResponse(c, http.StatusNotFound, "tour not found") // Пока упрощенно
		return
	}

	// Получаем информацию о городе
	city, err := h.services.City.GetByID(c.Request.Context(), tour.CityID)
	if err == nil && city != nil {
		tour.City = city.Name

		// Получаем информацию о стране
		country, err := h.services.Country.GetByID(c.Request.Context(), city.CountryID)
		if err == nil && country != nil {
			tour.Country = country.Name
			tour.Location = country.Name + ", " + city.Name
		}
	}

	c.JSON(http.StatusOK, tour)
}

// @Summary Get tour dates
// @Description Get available dates for a specific tour
// @Tags tours
// @Accept json
// @Produce json
// @Param id path int true "Tour ID"
// @Success 200 {array} domain.TourDate
// @Failure 400 {object} ErrorResponse "Invalid tour ID"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/tours/{id}/dates [get]
func (h *Handler) getTourDates(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid tour ID")
		return
	}

	// Получаем информацию о туре для определения продолжительности
	tour, err := h.services.Tour.GetByID(c.Request.Context(), id)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, "не удалось получить информацию о туре")
		return
	}

	// Получаем существующие даты тура
	dates, err := h.services.Tour.GetTourDates(c.Request.Context(), id)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Если дат нет, создаем их
	if len(dates) == 0 {
		// Получаем информацию о городе и стране для правильного отображения
		city, err := h.services.City.GetByID(c.Request.Context(), tour.CityID)
		if err == nil && city != nil {
			country, err := h.services.Country.GetByID(c.Request.Context(), city.CountryID)
			if err == nil && country != nil {
				tour.City = city.Name
				tour.Country = country.Name
				tour.Location = country.Name + ", " + city.Name
			}
		}

		// Определяем длительность тура из свойств тура, по умолчанию 7 дней
		duration := 7
		if tour.Duration > 0 {
			duration = tour.Duration
		}

		// Добавляем 5 будущих дат для тура (каждые 3 дня, начиная с завтрашнего дня)
		now := time.Now().AddDate(0, 0, 1) // начиная с завтрашнего дня
		for i := 0; i < 5; i++ {
			startDate := now.AddDate(0, 0, i*3) // каждые 3 дня
			endDate := startDate.AddDate(0, 0, duration)

			// Создаем разное количество мест и разные коэффициенты цены
			availability := 20 + i*5               // 20, 25, 30, 35, 40 мест
			priceModifier := 1.0 - float64(i)*0.05 // 1.0, 0.95, 0.90, 0.85, 0.80

			tourDate := &domain.TourDate{
				TourID:        id,
				StartDate:     startDate,
				EndDate:       endDate,
				Availability:  availability,
				PriceModifier: priceModifier,
			}

			dateID, err := h.services.Tour.AddTourDate(c.Request.Context(), tourDate)
			if err != nil {
				continue
			}

			// Добавляем созданную дату в массив для возврата
			tourDate.ID = dateID
			dates = append(dates, tourDate)
		}
	}

	// Если после попытки создания все еще нет дат, создадим хотя бы одну
	if len(dates) == 0 {
		now := time.Now().AddDate(0, 0, 1) // начиная с завтрашнего дня
		duration := 7
		if tour.Duration > 0 {
			duration = tour.Duration
		}

		tourDate := &domain.TourDate{
			TourID:        id,
			StartDate:     now,
			EndDate:       now.AddDate(0, 0, duration),
			Availability:  30,
			PriceModifier: 1.0,
		}

		dateID, err := h.services.Tour.AddTourDate(c.Request.Context(), tourDate)
		if err == nil {
			tourDate.ID = dateID
			dates = append(dates, tourDate)
		}
	}

	c.JSON(http.StatusOK, dates)
}

// @Summary Get all hotels
// @Description Get a list of all hotels with optional filters
// @Tags hotels
// @Accept json
// @Produce json
// @Param city_id query int false "Filter by city ID"
// @Param category query int false "Filter by category (stars)"
// @Param page query int false "Page number" default(1)
// @Param size query int false "Page size" default(10)
// @Success 200 {object} map[string]interface{} "List of hotels and total count"
// @Failure 400 {object} ErrorResponse "Invalid query parameters"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/hotels [get]
func (h *Handler) getAllHotels(c *gin.Context) {
	filters := make(map[string]interface{})
	if cityIDStr := c.Query("city_id"); cityIDStr != "" {
		cityID, err := strconv.Atoi(cityIDStr)
		if err != nil {
			newErrorResponse(c, http.StatusBadRequest, "invalid city_id parameter")
			return
		}
		filters["city_id"] = cityID
	}
	if categoryStr := c.Query("category"); categoryStr != "" {
		category, err := strconv.Atoi(categoryStr)
		if err != nil {
			newErrorResponse(c, http.StatusBadRequest, "invalid category parameter")
			return
		}
		filters["category"] = category
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))

	hotels, total, err := h.services.Hotel.List(c.Request.Context(), filters, page, size)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"hotels": hotels,
		"total":  total,
	})
}

// @Summary Get hotel by ID
// @Description Get details of a specific hotel by its ID
// @Tags hotels
// @Accept json
// @Produce json
// @Param id path int true "Hotel ID"
// @Success 200 {object} domain.Hotel
// @Failure 400 {object} ErrorResponse "Invalid hotel ID"
// @Failure 404 {object} ErrorResponse "Hotel not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/hotels/{id} [get]
func (h *Handler) getHotelByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid hotel ID")
		return
	}

	hotel, err := h.services.Hotel.GetByID(c.Request.Context(), id)
	if err != nil {
		// TODO: Различать ошибку "не найдено" и другие ошибки сервиса
		newErrorResponse(c, http.StatusNotFound, "hotel not found") // Пока упрощенно
		return
	}

	c.JSON(http.StatusOK, hotel)
}

// @Summary Get hotel rooms
// @Description Get available rooms for a specific hotel
// @Tags hotels
// @Accept json
// @Produce json
// @Param id path int true "Hotel ID"
// @Success 200 {array} domain.Room
// @Failure 400 {object} ErrorResponse "Invalid hotel ID"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/hotels/{id}/rooms [get]
func (h *Handler) getHotelRooms(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid hotel ID")
		return
	}

	rooms, err := h.services.Hotel.ListRoomsByHotelID(c.Request.Context(), id)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Получаем информацию об отеле
	hotel, err := h.services.Hotel.GetByID(c.Request.Context(), id)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, "не удалось получить информацию об отеле")
		return
	}

	// Если номеров нет, создаем их
	if len(rooms) == 0 {
		// Создаем разные типы номеров
		roomTypes := []struct {
			description string
			beds        int
			price       float64
			imageURL    string
		}{
			{"Стандартный одноместный номер", 1, 3500.0, "/images/rooms/standard_single.jpg"},
			{"Стандартный двухместный номер с двумя кроватями", 2, 5000.0, "/images/rooms/standard_twin.jpg"},
			{"Улучшенный двухместный номер с большой кроватью", 2, 5500.0, "/images/rooms/deluxe_double.jpg"},
			{"Полулюкс с видом на море", 2, 7000.0, "/images/rooms/junior_suite.jpg"},
			{"Люкс с балконом и джакузи", 2, 9000.0, "/images/rooms/suite.jpg"},
			{"Семейный номер с тремя кроватями", 3, 8000.0, "/images/rooms/family_room.jpg"},
			{"Апартаменты с кухней", 4, 10000.0, "/images/rooms/apartment.jpg"},
		}

		// Получаем категорию отеля и корректируем цены
		priceMultiplier := 1.0
		if hotel.Category > 0 {
			priceMultiplier = 1.0 + float64(hotel.Category-1)*0.2 // 1.0, 1.2, 1.4, 1.6, 1.8 для категорий 1-5
		}

		// Добавляем номера
		for _, roomType := range roomTypes {
			// Корректируем цену в зависимости от категории отеля
			price := roomType.price * priceMultiplier

			room := &domain.Room{
				HotelID:     id,
				Description: roomType.description,
				Beds:        roomType.beds,
				Price:       price,
				ImageURL:    roomType.imageURL,
				CreatedAt:   time.Now(),
			}

			roomID, err := h.services.Hotel.AddRoom(c.Request.Context(), room)
			if err != nil {
				continue
			}

			// Добавляем созданный номер в массив для возврата
			room.ID = roomID
			rooms = append(rooms, room)
		}
	}

	// Если после попытки создания все еще нет номеров, создадим хотя бы один
	if len(rooms) == 0 {
		room := &domain.Room{
			HotelID:     id,
			Description: "Стандартный номер",
			Beds:        2,
			Price:       5000.0,
			ImageURL:    "/images/rooms/standard_double.jpg",
			CreatedAt:   time.Now(),
		}

		roomID, err := h.services.Hotel.AddRoom(c.Request.Context(), room)
		if err == nil {
			room.ID = roomID
			rooms = append(rooms, room)
		}
	}

	c.JSON(http.StatusOK, rooms)
}

// wsTicketChat обрабатывает WebSocket соединение для чата в тикете
// func (h *Handler) wsTicketChat(c *gin.Context) {
// 	// TODO: Implement WebSocket chat logic
// 	c.JSON(http.StatusNotImplemented, gin.H{"message": "WebSocket chat not implemented yet"})
// }

// Добавим структуру для ответов с ошибками
type ErrorResponse struct {
	Message string `json:"error"`
}

func newErrorResponse(c *gin.Context, statusCode int, message string) {
	c.AbortWithStatusJSON(statusCode, ErrorResponse{Message: message})
}

// Вспомогательная функция для получения пользователя из контекста
func getUserFromContext(c *gin.Context) (*domain.User, bool) {
	userAny, exists := c.Get("user")
	if !exists {
		newErrorResponse(c, http.StatusUnauthorized, "user not found in context")
		return nil, false
	}
	user, ok := userAny.(*domain.User)
	if !ok {
		// Эта ошибка не должна возникать, если middleware работает корректно
		newErrorResponse(c, http.StatusInternalServerError, "invalid user type in context")
		return nil, false
	}
	return user, true
}

// @Summary Get current user profile
// @Security ApiKeyAuth
// @Description Get the profile information of the currently logged-in user
// @Tags users
// @Accept json
// @Produce json
// @Success 200 {object} domain.User
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/users/me [get]
func (h *Handler) getCurrentUser(c *gin.Context) {
	user, ok := getUserFromContext(c)
	if !ok {
		return // Error handled in getUserFromContext
	}
	// Re-fetch user data to ensure it's up-to-date? Or trust the token data?
	// For now, just return the user data from the token/context.
	// Note: Password field is already excluded by json:"-" in domain.User
	c.JSON(http.StatusOK, user)
}

type updateUserInput struct {
	Email     string `json:"email" binding:"omitempty,email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	FullName  string `json:"full_name"`
	Phone     string `json:"phone"`
	BirthDate string `json:"birth_date"`
}

// @Summary Update current user profile
// @Security ApiKeyAuth
// @Description Update the profile information of the currently logged-in user
// @Tags users
// @Accept json
// @Produce json
// @Param user body updateUserInput true "Updated user data (email, first_name, last_name, full_name, phone, birth_date)"
// @Success 200 {string} string "OK"
// @Failure 400 {object} ErrorResponse "Invalid input body"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/users/me [put]
func (h *Handler) updateCurrentUser(c *gin.Context) {
	user, ok := getUserFromContext(c)
	if !ok {
		return
	}

	var input updateUserInput
	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid input body: "+err.Error())
		return
	}

	// Update fields only if provided in the input and different from current
	updated := false
	if input.Email != "" && input.Email != user.Email {
		user.Email = input.Email
		updated = true
	}

	// Обрабатываем first_name, last_name и full_name
	if input.FirstName != user.FirstName {
		user.FirstName = input.FirstName
		updated = true
	}

	if input.LastName != user.LastName {
		user.LastName = input.LastName
		updated = true
	}

	// Если указано полное имя, используем его
	if input.FullName != "" && input.FullName != user.FullName {
		user.FullName = input.FullName
		updated = true
	} else if input.FirstName != "" || input.LastName != "" {
		// Иначе формируем полное имя из first_name и last_name
		user.FullName = strings.TrimSpace(input.FirstName + " " + input.LastName)
		updated = true
	}

	if input.Phone != user.Phone {
		user.Phone = input.Phone
		updated = true
	}

	if input.BirthDate != user.BirthDate {
		user.BirthDate = input.BirthDate
		updated = true
	}

	if !updated {
		c.Status(http.StatusOK) // Nothing to update
		return
	}

	err := h.services.User.Update(c.Request.Context(), user)
	if err != nil {
		// Handle potential duplicate email errors from the service layer
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.Status(http.StatusOK)
}

type changePasswordInput struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=8"` // Add password complexity rules?
}

// @Summary Change current user password
// @Security ApiKeyAuth
// @Description Change the password of the currently logged-in user
// @Tags users
// @Accept json
// @Produce json
// @Param passwords body changePasswordInput true "Old and new passwords"
// @Success 200 {string} string "OK"
// @Failure 400 {object} ErrorResponse "Invalid input body"
// @Failure 401 {object} ErrorResponse "Unauthorized or incorrect old password"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/users/me/password [put]
func (h *Handler) changePassword(c *gin.Context) {
	user, ok := getUserFromContext(c)
	if !ok {
		return
	}

	var input changePasswordInput
	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid input body: "+err.Error())
		return
	}

	err := h.services.Auth.ChangePassword(c.Request.Context(), user.ID, input.OldPassword, input.NewPassword)
	if err != nil {
		// Distinguish between "incorrect old password" and other errors
		if err == service.ErrInvalidCredentials { // Assuming service returns a specific error
			newErrorResponse(c, http.StatusUnauthorized, "incorrect old password")
		} else {
			newErrorResponse(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	c.Status(http.StatusOK)
}

// --- Order handlers ---

type createOrderInput struct {
	TourID      int64  `json:"tour_id" binding:"required"`
	TourDateID  int64  `json:"tour_date_id" binding:"required"`
	RoomID      *int64 `json:"room_id"` // Optional room selection
	PeopleCount int    `json:"people_count" binding:"required,gt=0"`
}

// @Summary Create a new order
// @Security ApiKeyAuth
// @Description Create a new tour order for the current user
// @Tags orders
// @Accept json
// @Produce json
// @Param order body createOrderInput true "Order details"
// @Success 201 {object} map[string]int64 "Created order ID"
// @Failure 400 {object} ErrorResponse "Invalid input body"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 500 {object} ErrorResponse "Internal server error (e.g., tour not available)"
// @Router /api/orders [post]
func (h *Handler) createOrder(c *gin.Context) {
	user, ok := getUserFromContext(c)
	if !ok {
		return
	}

	var input createOrderInput
	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid input body: "+err.Error())
		return
	}

	orderID, err := h.services.Order.Create(c.Request.Context(), user.ID, input.TourID, input.TourDateID, input.RoomID, input.PeopleCount)
	if err != nil {
		// TODO: Handle specific service errors (e.g., insufficient availability, invalid IDs)
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": orderID})
}

// @Summary Get user orders
// @Security ApiKeyAuth
// @Description Get a list of orders for the currently logged-in user
// @Tags orders
// @Accept json
// @Produce json
// @Success 200 {array} domain.Order
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/orders [get]
func (h *Handler) getUserOrders(c *gin.Context) {
	user, ok := getUserFromContext(c)
	if !ok {
		return
	}

	orders, err := h.services.Order.ListByUserID(c.Request.Context(), user.ID)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Обогащаем данные о заказах дополнительной информацией
	enrichedOrders := make([]map[string]interface{}, 0, len(orders))
	for _, order := range orders {
		enrichedOrder := map[string]interface{}{
			"id":          order.ID,
			"created_at":  order.CreatedAt,
			"status":      order.Status,
			"total_price": order.TotalPrice,
			"adults":      order.PeopleCount, // Используем PeopleCount как количество взрослых
			"children":    0,                 // По умолчанию 0 детей
		}

		// Получаем информацию о туре
		tour, err := h.services.Tour.GetByID(c.Request.Context(), order.TourID)
		if err == nil && tour != nil {
			// Получаем информацию о городе
			city, err := h.services.City.GetByID(c.Request.Context(), tour.CityID)
			if err == nil && city != nil {
				tour.City = city.Name

				// Получаем информацию о стране
				country, err := h.services.Country.GetByID(c.Request.Context(), city.CountryID)
				if err == nil && country != nil {
					tour.Country = country.Name
					tour.Location = country.Name + ", " + city.Name
				}
			}

			enrichedOrder["tour"] = map[string]interface{}{
				"id":        tour.ID,
				"name":      tour.Name,
				"image_url": tour.ImageURL,
				"location":  tour.Location,
			}
		} else {
			enrichedOrder["tour"] = map[string]interface{}{
				"id":        0,
				"name":      "Информация о туре недоступна",
				"image_url": "/images/tour-placeholder.jpg",
				"location":  "Местоположение неизвестно",
			}
		}

		// Получаем информацию о датах тура
		tourDate, err := h.services.Tour.GetTourDateByID(c.Request.Context(), order.TourDateID)
		if err == nil && tourDate != nil {
			enrichedOrder["start_date"] = tourDate.StartDate.Format("2006-01-02")
			enrichedOrder["end_date"] = tourDate.EndDate.Format("2006-01-02")
		} else {
			// Установим даты по умолчанию, если не удалось получить
			enrichedOrder["start_date"] = order.CreatedAt.Format("2006-01-02")
			enrichedOrder["end_date"] = order.CreatedAt.AddDate(0, 0, 7).Format("2006-01-02")
		}

		enrichedOrders = append(enrichedOrders, enrichedOrder)
	}

	c.JSON(http.StatusOK, enrichedOrders)
}

// @Summary Get order by ID
// @Security ApiKeyAuth
// @Description Get details of a specific order by its ID (checks ownership)
// @Tags orders
// @Accept json
// @Produce json
// @Param id path int true "Order ID"
// @Success 200 {object} domain.Order
// @Failure 400 {object} ErrorResponse "Invalid order ID"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden (not owner)"
// @Failure 404 {object} ErrorResponse "Order not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/orders/{id} [get]
func (h *Handler) getOrderByID(c *gin.Context) {
	user, ok := getUserFromContext(c)
	if !ok {
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid order ID")
		return
	}

	order, err := h.services.Order.GetByID(c.Request.Context(), id)
	if err != nil {
		// TODO: Handle not found error specifically (e.g., check error type)
		newErrorResponse(c, http.StatusNotFound, "order not found")
		return
	}

	// Check if the current user owns the order
	if order.UserID != user.ID {
		// Admins might be allowed to see any order via a different endpoint
		newErrorResponse(c, http.StatusForbidden, "you do not have permission to view this order")
		return
	}

	c.JSON(http.StatusOK, order)
}

// @Summary Cancel an order
// @Security ApiKeyAuth
// @Description Cancel a specific order by its ID (checks ownership)
// @Tags orders
// @Accept json
// @Produce json
// @Param id path int true "Order ID"
// @Success 204 "No Content"
// @Failure 400 {object} ErrorResponse "Invalid order ID or order cannot be cancelled"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden (not owner)"
// @Failure 404 {object} ErrorResponse "Order not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/orders/{id} [delete]
func (h *Handler) cancelOrder(c *gin.Context) {
	user, ok := getUserFromContext(c)
	if !ok {
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid order ID")
		return
	}

	// Optional: Fetch order first to check ownership and status before attempting delete/cancel
	order, err := h.services.Order.GetByID(c.Request.Context(), id)
	if err != nil {
		newErrorResponse(c, http.StatusNotFound, "order not found")
		return
	}
	if order.UserID != user.ID {
		newErrorResponse(c, http.StatusForbidden, "you do not have permission to cancel this order")
		return
	}
	// Optional: Check if order status allows cancellation
	if order.Status != string(domain.OrderStatusPending) && order.Status != string(domain.OrderStatusConfirmed) {
		newErrorResponse(c, http.StatusBadRequest, fmt.Sprintf("order with status '%s' cannot be cancelled", order.Status))
		return
	}

	// Service should handle the logic of cancellation (e.g., setting status to 'cancelled')
	// Using UpdateStatus for cancellation logic as per Service interface
	err = h.services.Order.UpdateStatus(c.Request.Context(), id, string(domain.OrderStatusCancelled))
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.Status(http.StatusNoContent)
}

// --- Support Ticket Handlers ---

type createTicketInput struct {
	Subject string `json:"subject" binding:"required"`
	Message string `json:"message" binding:"required"` // Initial message
}

// @Summary Create a new support ticket
// @Security ApiKeyAuth
// @Description Create a new support ticket with an initial message
// @Tags tickets
// @Accept json
// @Produce json
// @Param ticket body createTicketInput true "Ticket subject and initial message"
// @Success 201 {object} map[string]int64 "Created ticket ID"
// @Failure 400 {object} ErrorResponse "Invalid input body"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/tickets [post]
func (h *Handler) createTicket(c *gin.Context) {
	user, ok := getUserFromContext(c)
	if !ok {
		return
	}

	var input createTicketInput
	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid input body: "+err.Error())
		return
	}

	ticketID, err := h.services.SupportTicket.Create(c.Request.Context(), user.ID, input.Subject, input.Message)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": ticketID})
}

// @Summary Get user tickets
// @Security ApiKeyAuth
// @Description Get a list of support tickets for the currently logged-in user
// @Tags tickets
// @Accept json
// @Produce json
// @Success 200 {array} domain.SupportTicket
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/tickets [get]
func (h *Handler) getUserTickets(c *gin.Context) {
	user, ok := getUserFromContext(c)
	if !ok {
		return
	}

	tickets, err := h.services.SupportTicket.ListByUserID(c.Request.Context(), user.ID)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, tickets)
}

// @Summary Get ticket by ID
// @Security ApiKeyAuth
// @Description Get details of a specific support ticket by its ID (checks ownership or support role)
// @Tags tickets, support
// @Accept json
// @Produce json
// @Param id path int true "Ticket ID"
// @Success 200 {object} domain.SupportTicket
// @Failure 400 {object} ErrorResponse "Invalid ticket ID"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden (not owner or support staff)"
// @Failure 404 {object} ErrorResponse "Ticket not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/tickets/{id} [get]
// @Router /api/support/tickets/{id} [get] // Added route for support access
func (h *Handler) getTicketByID(c *gin.Context) {
	user, ok := getUserFromContext(c)
	if !ok {
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid ticket ID")
		return
	}

	ticket, err := h.services.SupportTicket.GetByID(c.Request.Context(), id)
	if err != nil {
		// TODO: Handle not found error specifically
		newErrorResponse(c, http.StatusNotFound, "ticket not found")
		return
	}

	// Check if the user owns the ticket OR is support/admin
	isSupportOrAdmin := user.RoleID == SupportRoleID || user.RoleID == AdminRoleID
	if ticket.UserID != user.ID && !isSupportOrAdmin {
		newErrorResponse(c, http.StatusForbidden, "you do not have permission to view this ticket")
		return
	}

	c.JSON(http.StatusOK, ticket)
}

type addTicketMessageInput struct {
	Message string `json:"message" binding:"required"`
}

// @Summary Add a message to a ticket
// @Security ApiKeyAuth
// @Description Add a new message to a specific support ticket (checks ownership or support role)
// @Tags tickets, support
// @Accept json
// @Produce json
// @Param id path int true "Ticket ID"
// @Param message body addTicketMessageInput true "Message content"
// @Success 201 {object} map[string]int64 "Created message ID"
// @Failure 400 {object} ErrorResponse "Invalid input body or ticket ID"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden (not owner or support staff, or ticket closed)"
// @Failure 404 {object} ErrorResponse "Ticket not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/tickets/{id}/messages [post]
// @Router /api/support/tickets/{id}/messages [post] // Added route for support access
func (h *Handler) addTicketMessage(c *gin.Context) {
	user, ok := getUserFromContext(c)
	if !ok {
		return
	}

	idStr := c.Param("id")
	ticketID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid ticket ID")
		return
	}

	var input addTicketMessageInput
	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid input body: "+err.Error())
		return
	}

	// Check permission and ticket status before adding message
	ticket, err := h.services.SupportTicket.GetByID(c.Request.Context(), ticketID)
	if err != nil {
		newErrorResponse(c, http.StatusNotFound, "ticket not found")
		return
	}

	isSupportOrAdmin := user.RoleID == SupportRoleID || user.RoleID == AdminRoleID
	if ticket.UserID != user.ID && !isSupportOrAdmin {
		newErrorResponse(c, http.StatusForbidden, "you do not have permission to add messages to this ticket")
		return
	}
	if ticket.Status == string(domain.TicketStatusClosed) {
		newErrorResponse(c, http.StatusForbidden, "cannot add messages to a closed ticket")
		return
	}

	messageID, err := h.services.SupportTicket.AddMessage(c.Request.Context(), ticketID, user.ID, input.Message)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Optionally, update ticket status to 'in_progress' if added by support?
	if isSupportOrAdmin && ticket.Status == string(domain.TicketStatusOpen) {
		_ = h.services.SupportTicket.UpdateStatus(c.Request.Context(), ticketID, string(domain.TicketStatusInProgress))
		// Log potential error during status update?
	}

	c.JSON(http.StatusCreated, gin.H{"id": messageID})
}

// @Summary Get ticket messages
// @Security ApiKeyAuth
// @Description Get all messages for a specific support ticket (checks ownership or support role)
// @Tags tickets, support
// @Accept json
// @Produce json
// @Param id path int true "Ticket ID"
// @Success 200 {array} domain.TicketMessage
// @Failure 400 {object} ErrorResponse "Invalid ticket ID"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden (not owner or support staff)"
// @Failure 404 {object} ErrorResponse "Ticket not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/tickets/{id}/messages [get]
// @Router /api/support/tickets/{id}/messages [get] // Added route for support access
func (h *Handler) getTicketMessages(c *gin.Context) {
	user, ok := getUserFromContext(c)
	if !ok {
		return
	}

	idStr := c.Param("id")
	ticketID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid ticket ID")
		return
	}

	// Check permission before getting messages
	ticket, err := h.services.SupportTicket.GetByID(c.Request.Context(), ticketID)
	if err != nil {
		newErrorResponse(c, http.StatusNotFound, "ticket not found")
		return
	}
	isSupportOrAdmin := user.RoleID == SupportRoleID || user.RoleID == AdminRoleID
	if ticket.UserID != user.ID && !isSupportOrAdmin {
		newErrorResponse(c, http.StatusForbidden, "you do not have permission to view messages for this ticket")
		return
	}

	messages, err := h.services.SupportTicket.GetMessages(c.Request.Context(), ticketID)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, messages)
}

// @Summary Close a support ticket (User only)
// @Security ApiKeyAuth
// @Description Mark a support ticket as closed by the user who created it
// @Tags tickets
// @Accept json
// @Produce json
// @Param id path int true "Ticket ID"
// @Success 200 {string} string "OK"
// @Failure 400 {object} ErrorResponse "Invalid ticket ID"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden (not owner or ticket already closed)"
// @Failure 404 {object} ErrorResponse "Ticket not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/tickets/{id}/close [put]
func (h *Handler) closeTicket(c *gin.Context) {
	user, ok := getUserFromContext(c)
	if !ok {
		return
	}

	idStr := c.Param("id")
	ticketID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid ticket ID")
		return
	}

	// Check ownership and status
	ticket, err := h.services.SupportTicket.GetByID(c.Request.Context(), ticketID)
	if err != nil {
		newErrorResponse(c, http.StatusNotFound, "ticket not found")
		return
	}
	if ticket.UserID != user.ID {
		newErrorResponse(c, http.StatusForbidden, "you do not have permission to close this ticket")
		return
	}
	if ticket.Status == string(domain.TicketStatusClosed) {
		newErrorResponse(c, http.StatusBadRequest, "ticket is already closed")
		return
	}

	// Use CloseTicket service method if available and handles setting status + closed_at
	err = h.services.SupportTicket.CloseTicket(c.Request.Context(), ticketID)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.Status(http.StatusOK)
}

// --- Admin User Management ---

// @Summary Get all users (Admin only)
// @Security ApiKeyAuth
// @Description Get a list of all users
// @Tags admin-users
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param size query int false "Page size" default(10)
// @Success 200 {object} map[string]interface{} "List of users and total count"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/admin/users [get]
func (h *Handler) getAllUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))

	users, total, err := h.services.User.List(c.Request.Context(), page, size)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"users": users,
		"total": total,
	})
}

// @Summary Get user by ID (Admin only)
// @Security ApiKeyAuth
// @Description Get details of a specific user by ID
// @Tags admin-users
// @Accept json
// @Produce json
// @Param id path int true "User ID"
// @Success 200 {object} domain.User
// @Failure 400 {object} ErrorResponse "Invalid user ID"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "User not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/admin/users/{id} [get]
func (h *Handler) getUserByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid user ID")
		return
	}

	user, err := h.services.User.GetByID(c.Request.Context(), id)
	if err != nil {
		// TODO: Handle not found error specifically
		newErrorResponse(c, http.StatusNotFound, "user not found")
		return
	}

	c.JSON(http.StatusOK, user)
}

type adminUpdateUserInput struct {
	Username  string `json:"username" binding:"required"`
	Email     string `json:"email" binding:"required,email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	FullName  string `json:"full_name"`
	Phone     string `json:"phone"`
	RoleID    int64  `json:"role_id" binding:"required"`
}

// @Summary Update user by ID (Admin only)
// @Security ApiKeyAuth
// @Description Update details of a specific user by ID
// @Tags admin-users
// @Accept json
// @Produce json
// @Param id path int true "User ID"
// @Param user body adminUpdateUserInput true "Updated user data (username, email, first_name, last_name, full_name, phone, role_id)"
// @Success 200 {string} string "OK"
// @Failure 400 {object} ErrorResponse "Invalid input body or ID"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "User not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/admin/users/{id} [put]
func (h *Handler) updateUser(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid user ID")
		return
	}

	var input adminUpdateUserInput
	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid input body: "+err.Error())
		return
	}

	// Fetch existing user to update? Or create a new struct?
	// Creating a new struct requires password field, which we don't want to update here.
	// Fetching existing is safer.
	userToUpdate, err := h.services.User.GetByID(c.Request.Context(), id)
	if err != nil {
		newErrorResponse(c, http.StatusNotFound, "user not found")
		return
	}

	// Update fields from input
	userToUpdate.Username = input.Username
	userToUpdate.Email = input.Email

	// Обновляем поля имени
	userToUpdate.FirstName = input.FirstName
	userToUpdate.LastName = input.LastName

	// Если указано полное имя, используем его
	if input.FullName != "" {
		userToUpdate.FullName = input.FullName
	} else {
		// Иначе формируем полное имя из first_name и last_name
		userToUpdate.FullName = strings.TrimSpace(input.FirstName + " " + input.LastName)
	}

	userToUpdate.Phone = input.Phone
	userToUpdate.RoleID = input.RoleID

	// Add validation using the standard validator
	v := validator.New()
	err = v.Struct(input) // Validate the input struct based on its tags
	if err != nil {
		// Provide a more generic error or parse err.(validator.ValidationErrors) for specifics
		newErrorResponse(c, http.StatusBadRequest, "validation failed: "+err.Error())
		return
	}
	// Add specific range validation for RoleID not covered by struct tags easily
	err = v.Var(userToUpdate.RoleID, "min=1,max=3") // Assuming roles 1, 2, 3 exist
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid role_id (must be between 1 and 3)")
		return
	}

	err = h.services.User.Update(c.Request.Context(), userToUpdate)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error()) // Could be duplicate email/username
		return
	}

	c.Status(http.StatusOK)
}

// @Summary Delete user by ID (Admin only)
// @Security ApiKeyAuth
// @Description Delete a specific user by ID
// @Tags admin-users
// @Accept json
// @Produce json
// @Param id path int true "User ID"
// @Success 204 "No Content"
// @Failure 400 {object} ErrorResponse "Invalid user ID"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "User not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/admin/users/{id} [delete]
func (h *Handler) deleteUser(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid user ID")
		return
	}

	err = h.services.User.Delete(c.Request.Context(), id)
	if err != nil {
		// TODO: Handle not found error specifically
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.Status(http.StatusNoContent)
}

// --- Admin Tour Management ---

// @Summary Create a new tour (Admin only)
// @Security ApiKeyAuth
// @Description Create a new tour
// @Tags admin-tours
// @Accept json
// @Produce json
// @Param tour body domain.Tour true "Tour data (ID ignored)"
// @Success 201 {object} map[string]int64 "Created tour ID"
// @Failure 400 {object} ErrorResponse "Invalid input body"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/admin/tours [post]
func (h *Handler) createTour(c *gin.Context) {
	var input domain.Tour
	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid input body")
		return
	}
	input.ID = 0 // Ensure ID is not set by client

	// Basic validation example using standard validator
	v := validator.New()
	// Assuming domain.Tour has appropriate `validate` tags, e.g.,
	// Name string `json:"name" validate:"required"`
	// Description string `json:"description" validate:"required"`
	// BasePrice float64 `json:"base_price" validate:"gt=0"`
	// CityID int64 `json:"city_id" validate:"required,gt=0"`
	// Duration int `json:"duration" validate:"required,gt=0"`
	err := v.Struct(input)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "validation failed: "+err.Error())
		return
	}

	id, err := h.services.Tour.Create(c.Request.Context(), &input)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id})
}

// @Summary Update a tour (Admin only)
// @Security ApiKeyAuth
// @Description Update an existing tour
// @Tags admin-tours
// @Accept json
// @Produce json
// @Param id path int true "Tour ID"
// @Param tour body domain.Tour true "Updated tour data (ID ignored)"
// @Success 200 {string} string "OK"
// @Failure 400 {object} ErrorResponse "Invalid input body or ID"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Tour not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/admin/tours/{id} [put]
func (h *Handler) updateTour(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid tour ID")
		return
	}

	var input domain.Tour
	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid input body")
		return
	}
	input.ID = id // Ensure ID is set from path param

	// Basic validation example using standard validator
	v := validator.New()
	// Assuming domain.Tour has appropriate `validate` tags (see createTour)
	err = v.Struct(input)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "validation failed: "+err.Error())
		return
	}

	err = h.services.Tour.Update(c.Request.Context(), &input)
	if err != nil {
		// TODO: Handle not found error specifically
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.Status(http.StatusOK)
}

// @Summary Delete a tour (Admin only)
// @Security ApiKeyAuth
// @Description Delete a tour by its ID
// @Tags admin-tours
// @Accept json
// @Produce json
// @Param id path int true "Tour ID"
// @Success 204 "No Content"
// @Failure 400 {object} ErrorResponse "Invalid tour ID"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Tour not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/admin/tours/{id} [delete]
func (h *Handler) deleteTour(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid tour ID")
		return
	}

	err = h.services.Tour.Delete(c.Request.Context(), id)
	if err != nil {
		// TODO: Handle not found error specifically
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.Status(http.StatusNoContent)
}

// @Summary Add a tour date (Admin only)
// @Security ApiKeyAuth
// @Description Add a new available date for a tour
// @Tags admin-tours
// @Accept json
// @Produce json
// @Param id path int true "Tour ID"
// @Param tourDate body domain.TourDate true "Tour date data (ID ignored)"
// @Success 201 {object} map[string]int64 "Created tour date ID"
// @Failure 400 {object} ErrorResponse "Invalid input body or ID"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/admin/tours/{id}/dates [post]
func (h *Handler) addTourDate(c *gin.Context) {
	tourIDStr := c.Param("id")
	tourID, err := strconv.ParseInt(tourIDStr, 10, 64)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid tour ID")
		return
	}

	var input domain.TourDate
	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid input body: "+err.Error())
		return
	}
	input.TourID = tourID // Ensure TourID is set from path
	input.ID = 0          // Ensure ID is not set by client

	// Basic validation example using standard validator
	v := validator.New()
	// Assuming domain.TourDate has appropriate `validate` tags, e.g.,
	// StartDate time.Time `json:"start_date" validate:"required"`
	// EndDate time.Time `json:"end_date" validate:"required,gtefield=StartDate"`
	// Availability int `json:"availability" validate:"gt=0"`
	if input.StartDate.IsZero() || input.EndDate.IsZero() || input.EndDate.Before(input.StartDate) {
		newErrorResponse(c, http.StatusBadRequest, "invalid start or end date")
		return
	}
	err = v.Struct(input) // Validate based on tags
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "validation failed: "+err.Error())
		return
	}

	id, err := h.services.Tour.AddTourDate(c.Request.Context(), &input)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id})
}

// @Summary Update a tour date (Admin only)
// @Security ApiKeyAuth
// @Description Update an existing tour date
// @Tags admin-tours
// @Accept json
// @Produce json
// @Param id path int true "Tour ID"
// @Param dateId path int true "Tour Date ID"
// @Param tourDate body domain.TourDate true "Updated tour date data (IDs ignored)"
// @Success 200 {string} string "OK"
// @Failure 400 {object} ErrorResponse "Invalid input body or IDs"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Tour date not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/admin/tours/{id}/dates/{dateId} [put]
func (h *Handler) updateTourDate(c *gin.Context) {
	tourIDStr := c.Param("id")
	tourID, err := strconv.ParseInt(tourIDStr, 10, 64)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid tour ID")
		return
	}
	dateIDStr := c.Param("dateId")
	dateID, err := strconv.ParseInt(dateIDStr, 10, 64)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid tour date ID")
		return
	}

	var input domain.TourDate
	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid input body: "+err.Error())
		return
	}
	input.ID = dateID // Ensure IDs are set from path params
	input.TourID = tourID

	// Basic validation example using standard validator
	v := validator.New()
	// Assuming domain.TourDate has appropriate `validate` tags (see addTourDate)
	if input.StartDate.IsZero() || input.EndDate.IsZero() || input.EndDate.Before(input.StartDate) {
		newErrorResponse(c, http.StatusBadRequest, "invalid start or end date")
		return
	}
	err = v.Struct(input) // Validate based on tags
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "validation failed: "+err.Error())
		return
	}

	err = h.services.Tour.UpdateTourDate(c.Request.Context(), &input)
	if err != nil {
		// TODO: Handle not found error specifically
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.Status(http.StatusOK)
}

// @Summary Delete a tour date (Admin only)
// @Security ApiKeyAuth
// @Description Delete a tour date by its ID
// @Tags admin-tours
// @Accept json
// @Produce json
// @Param id path int true "Tour ID" // Keep for consistency, though maybe not needed by service
// @Param dateId path int true "Tour Date ID"
// @Success 204 "No Content"
// @Failure 400 {object} ErrorResponse "Invalid tour date ID"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Tour date not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/admin/tours/{id}/dates/{dateId} [delete]
func (h *Handler) deleteTourDate(c *gin.Context) {
	// tourIDStr := c.Param("id") // Не используется в сервисе, но может быть полезен для проверки
	dateIDStr := c.Param("dateId")
	dateID, err := strconv.ParseInt(dateIDStr, 10, 64)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid tour date ID")
		return
	}

	err = h.services.Tour.DeleteTourDate(c.Request.Context(), dateID)
	if err != nil {
		// TODO: Handle not found error specifically
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.Status(http.StatusNoContent)
}

// --- Admin Hotel Management ---

// @Summary Create a new hotel (Admin only)
// @Security ApiKeyAuth
// @Description Create a new hotel
// @Tags admin-hotels
// @Accept json
// @Produce json
// @Param hotel body domain.Hotel true "Hotel data (ID ignored)"
// @Success 201 {object} map[string]int64 "Created hotel ID"
// @Failure 400 {object} ErrorResponse "Invalid input body"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/admin/hotels [post]
func (h *Handler) createHotel(c *gin.Context) {
	var input domain.Hotel
	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid input body")
		return
	}
	input.ID = 0 // Ensure ID is not set by client

	// Basic validation example using standard validator
	v := validator.New()
	// Assuming domain.Hotel has appropriate `validate` tags, e.g.,
	// Name string `json:"name" validate:"required"`
	// Address string `json:"address" validate:"required"`
	// CityID int64 `json:"city_id" validate:"required,gt=0"`
	// Category int `json:"category" validate:"min=1,max=5"`
	err := v.Struct(input)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "validation failed: "+err.Error())
		return
	}

	id, err := h.services.Hotel.Create(c.Request.Context(), &input)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id})
}

// @Summary Update a hotel (Admin only)
// @Security ApiKeyAuth
// @Description Update an existing hotel
// @Tags admin-hotels
// @Accept json
// @Produce json
// @Param id path int true "Hotel ID"
// @Param hotel body domain.Hotel true "Updated hotel data (ID ignored)"
// @Success 200 {string} string "OK"
// @Failure 400 {object} ErrorResponse "Invalid input body or ID"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Hotel not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/admin/hotels/{id} [put]
func (h *Handler) updateHotel(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid hotel ID")
		return
	}

	var input domain.Hotel
	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid input body")
		return
	}
	input.ID = id // Ensure ID is set from path param

	// Basic validation example using standard validator
	v := validator.New()
	// Assuming domain.Hotel has appropriate `validate` tags (see createHotel)
	err = v.Struct(input)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "validation failed: "+err.Error())
		return
	}

	err = h.services.Hotel.Update(c.Request.Context(), &input)
	if err != nil {
		// TODO: Handle not found error specifically
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.Status(http.StatusOK)
}

// @Summary Delete a hotel (Admin only)
// @Security ApiKeyAuth
// @Description Delete a hotel by its ID
// @Tags admin-hotels
// @Accept json
// @Produce json
// @Param id path int true "Hotel ID"
// @Success 204 "No Content"
// @Failure 400 {object} ErrorResponse "Invalid hotel ID"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Hotel not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/admin/hotels/{id} [delete]
func (h *Handler) deleteHotel(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid hotel ID")
		return
	}

	err = h.services.Hotel.Delete(c.Request.Context(), id)
	if err != nil {
		// TODO: Handle not found error specifically
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.Status(http.StatusNoContent)
}

// @Summary Add a room to a hotel (Admin only)
// @Security ApiKeyAuth
// @Description Add a new room to a specified hotel
// @Tags admin-hotels
// @Accept json
// @Produce json
// @Param id path int true "Hotel ID"
// @Param room body domain.Room true "Room data (ID ignored)"
// @Success 201 {object} map[string]int64 "Created room ID"
// @Failure 400 {object} ErrorResponse "Invalid input body or hotel ID"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/admin/hotels/{id}/rooms [post]
func (h *Handler) addRoom(c *gin.Context) {
	hotelIDStr := c.Param("id")
	hotelID, err := strconv.ParseInt(hotelIDStr, 10, 64)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid hotel ID")
		return
	}

	var input domain.Room
	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid input body")
		return
	}
	input.HotelID = hotelID // Ensure HotelID is set from path
	input.ID = 0            // Ensure ID is not set by client

	// Basic validation example using standard validator
	v := validator.New()
	// Assuming domain.Room has appropriate `validate` tags, e.g.,
	// Name string `json:"name" validate:"required"`
	// PricePerNight float64 `json:"price_per_night" validate:"gt=0"`
	// Capacity int `json:"capacity" validate:"gt=0"`
	err = v.Struct(input)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "validation failed: "+err.Error())
		return
	}

	id, err := h.services.Hotel.AddRoom(c.Request.Context(), &input)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id})
}

// @Summary Update a room (Admin only)
// @Security ApiKeyAuth
// @Description Update an existing room in a hotel
// @Tags admin-hotels
// @Accept json
// @Produce json
// @Param id path int true "Hotel ID"
// @Param roomId path int true "Room ID"
// @Param room body domain.Room true "Updated room data (IDs ignored)"
// @Success 200 {string} string "OK"
// @Failure 400 {object} ErrorResponse "Invalid input body or IDs"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Room not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/admin/hotels/{id}/rooms/{roomId} [put]
func (h *Handler) updateRoom(c *gin.Context) {
	hotelIDStr := c.Param("id")
	hotelID, err := strconv.ParseInt(hotelIDStr, 10, 64)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid hotel ID")
		return
	}
	roomIDStr := c.Param("roomId")
	roomID, err := strconv.ParseInt(roomIDStr, 10, 64)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid room ID")
		return
	}

	var input domain.Room
	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid input body")
		return
	}
	input.ID = roomID // Ensure IDs are set from path params
	input.HotelID = hotelID

	// Basic validation example using standard validator
	v := validator.New()
	// Assuming domain.Room has appropriate `validate` tags (see addRoom)
	err = v.Struct(input)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "validation failed: "+err.Error())
		return
	}

	err = h.services.Hotel.UpdateRoom(c.Request.Context(), &input)
	if err != nil {
		// TODO: Handle not found error specifically
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.Status(http.StatusOK)
}

// @Summary Delete a room (Admin only)
// @Security ApiKeyAuth
// @Description Delete a room by its ID
// @Tags admin-hotels
// @Accept json
// @Produce json
// @Param id path int true "Hotel ID" // Keep for consistency, though maybe not needed by service
// @Param roomId path int true "Room ID"
// @Success 204 "No Content"
// @Failure 400 {object} ErrorResponse "Invalid room ID"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Room not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/admin/hotels/{id}/rooms/{roomId} [delete]
func (h *Handler) deleteRoom(c *gin.Context) {
	// hotelIDStr := c.Param("id") // Not needed by service method
	roomIDStr := c.Param("roomId")
	roomID, err := strconv.ParseInt(roomIDStr, 10, 64)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid room ID")
		return
	}

	err = h.services.Hotel.DeleteRoom(c.Request.Context(), roomID)
	if err != nil {
		// TODO: Handle not found error specifically
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.Status(http.StatusNoContent)
}

// --- Admin Order Management ---

// @Summary Get all orders (Admin only)
// @Security ApiKeyAuth
// @Description Get a list of all orders with optional filters
// @Tags admin-orders
// @Accept json
// @Produce json
// @Param user_id query int false "Filter by user ID"
// @Param status query string false "Filter by status (e.g., pending, confirmed)"
// @Param page query int false "Page number" default(1)
// @Param size query int false "Page size" default(10)
// @Success 200 {object} map[string]interface{} "List of orders and total count"
// @Failure 400 {object} ErrorResponse "Invalid query parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/admin/orders [get]
func (h *Handler) getAllOrders(c *gin.Context) {
	filters := make(map[string]interface{})
	if userIDStr := c.Query("user_id"); userIDStr != "" {
		userID, err := strconv.Atoi(userIDStr)
		if err != nil {
			newErrorResponse(c, http.StatusBadRequest, "invalid user_id parameter")
			return
		}
		filters["user_id"] = userID
	}
	if status := c.Query("status"); status != "" {
		// Validate status?
		switch domain.OrderStatus(status) {
		case domain.OrderStatusPending, domain.OrderStatusConfirmed, domain.OrderStatusPaid, domain.OrderStatusCancelled, domain.OrderStatusCompleted:
			filters["status"] = status
		default:
			newErrorResponse(c, http.StatusBadRequest, "invalid status parameter")
			return
		}
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))

	orders, total, err := h.services.Order.List(c.Request.Context(), filters, page, size)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"orders": orders,
		"total":  total,
	})
}

type updateOrderStatusInput struct {
	Status string `json:"status" binding:"required"`
}

// @Summary Update order status (Admin only)
// @Security ApiKeyAuth
// @Description Update the status of a specific order
// @Tags admin-orders
// @Accept json
// @Produce json
// @Param id path int true "Order ID"
// @Param status body updateOrderStatusInput true "New order status"
// @Success 200 {string} string "OK"
// @Failure 400 {object} ErrorResponse "Invalid input body, ID, or status value"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Order not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/admin/orders/{id}/status [put]
func (h *Handler) updateOrderStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid order ID")
		return
	}

	var input updateOrderStatusInput
	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid input body: "+err.Error())
		return
	}

	// Validate status value
	switch domain.OrderStatus(input.Status) {
	case domain.OrderStatusPending, domain.OrderStatusConfirmed, domain.OrderStatusPaid, domain.OrderStatusCancelled, domain.OrderStatusCompleted:
		// Valid status
	default:
		newErrorResponse(c, http.StatusBadRequest, "invalid status value")
		return
	}

	err = h.services.Order.UpdateStatus(c.Request.Context(), id, input.Status)
	if err != nil {
		// TODO: Handle not found error specifically
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.Status(http.StatusOK)
}

// --- Admin/Support Ticket Management ---

// @Summary Get all tickets (Admin/Support)
// @Security ApiKeyAuth
// @Description Get a list of all support tickets with optional filters
// @Tags admin-tickets, support
// @Accept json
// @Produce json
// @Param user_id query int false "Filter by user ID"
// @Param status query string false "Filter by status (open, in_progress, closed)"
// @Param page query int false "Page number" default(1)
// @Param size query int false "Page size" default(10)
// @Success 200 {object} map[string]interface{} "List of tickets and total count"
// @Failure 400 {object} ErrorResponse "Invalid query parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/admin/tickets [get]
// @Router /api/support/tickets [get] // Shared endpoint for support
func (h *Handler) getAllTickets(c *gin.Context) {
	filters := make(map[string]interface{})
	if userIDStr := c.Query("user_id"); userIDStr != "" {
		userID, err := strconv.Atoi(userIDStr)
		if err != nil {
			newErrorResponse(c, http.StatusBadRequest, "invalid user_id parameter")
			return
		}
		filters["user_id"] = userID
	}
	if status := c.Query("status"); status != "" {
		// Validate status?
		switch domain.TicketStatus(status) {
		case domain.TicketStatusOpen, domain.TicketStatusInProgress, domain.TicketStatusClosed:
			filters["status"] = status
		default:
			newErrorResponse(c, http.StatusBadRequest, "invalid status parameter")
			return
		}
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))

	tickets, total, err := h.services.SupportTicket.List(c.Request.Context(), filters, page, size)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"tickets": tickets,
		"total":   total,
	})
}

type updateTicketStatusInput struct {
	Status string `json:"status" binding:"required"`
}

// @Summary Update ticket status (Admin/Support)
// @Security ApiKeyAuth
// @Description Update the status of a specific support ticket
// @Tags admin-tickets, support
// @Accept json
// @Produce json
// @Param id path int true "Ticket ID"
// @Param status body updateTicketStatusInput true "New ticket status (open, in_progress, closed)"
// @Success 200 {string} string "OK"
// @Failure 400 {object} ErrorResponse "Invalid input body, ID, or status value"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Ticket not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /api/admin/tickets/{id}/status [put]
// @Router /api/support/tickets/{id}/status [put] // Shared endpoint for support
func (h *Handler) updateTicketStatus(c *gin.Context) {
	idStr := c.Param("id")
	ticketID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid ticket ID")
		return
	}

	var input updateTicketStatusInput
	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid input body: "+err.Error())
		return
	}

	// Validate status value
	switch domain.TicketStatus(input.Status) {
	case domain.TicketStatusOpen, domain.TicketStatusInProgress, domain.TicketStatusClosed:
		// Valid status
	default:
		newErrorResponse(c, http.StatusBadRequest, "invalid status value")
		return
	}

	err = h.services.SupportTicket.UpdateStatus(c.Request.Context(), ticketID, input.Status)
	if err != nil {
		// TODO: Handle not found error specifically
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.Status(http.StatusOK)
}

// --- Auth Handlers (already implemented) ---
// register
// login
// refreshToken
// ... rest of the file ...
