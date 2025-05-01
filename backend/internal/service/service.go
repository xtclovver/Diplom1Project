package service

import (
	"context"

	"github.com/usedcvnt/Diplom1Project/backend/internal/domain"
	"github.com/usedcvnt/Diplom1Project/backend/internal/repository"
	"github.com/usedcvnt/Diplom1Project/backend/pkg/auth"
)

// Service содержит все сервисы приложения
type Service struct {
	User          UserService
	Auth          AuthService
	Tour          TourService
	Hotel         HotelService
	Order         OrderService
	SupportTicket SupportTicketService
	City          CityService
	Country       CountryService
}

// NewService создает новый экземпляр Service
func NewService(repos *repository.Repository, tokenManager auth.TokenManager) *Service {
	return &Service{
		User:          NewUserService(repos.User),
		Auth:          NewAuthService(repos.User, tokenManager),
		Tour:          NewTourService(repos.Tour),
		Hotel:         NewHotelService(repos.Hotel, repos.Room),
		Order:         NewOrderService(repos.Order, repos.Tour, repos.User, repos.Room),
		SupportTicket: NewSupportTicketService(repos.SupportTicket, repos.User),
		City:          NewCityService(repos.City),
		Country:       NewCountryService(repos.Country),
	}
}

// UserService интерфейс для работы с пользователями
type UserService interface {
	Create(ctx context.Context, user *domain.User) (int64, error)
	GetByID(ctx context.Context, id int64) (*domain.User, error)
	Update(ctx context.Context, user *domain.User) error
	Delete(ctx context.Context, id int64) error
	List(ctx context.Context, page, size int) ([]*domain.User, int, error)
}

// AuthService интерфейс для аутентификации и авторизации
type AuthService interface {
	Register(ctx context.Context, username, email, password, firstName, lastName, fullName, phone string) (int64, error)
	Login(ctx context.Context, usernameOrEmail, password string) (string, string, error) // Возвращает access и refresh токены
	ValidateToken(ctx context.Context, token string) (*domain.User, error)
	RefreshToken(ctx context.Context, refreshToken string) (string, string, error) // Возвращает новые access и refresh токены
	ChangePassword(ctx context.Context, userID int64, oldPassword, newPassword string) error
}

// TourService интерфейс для работы с турами
type TourService interface {
	Create(ctx context.Context, tour *domain.Tour) (int64, error)
	GetByID(ctx context.Context, id int64) (*domain.Tour, error)
	Update(ctx context.Context, tour *domain.Tour) error
	Delete(ctx context.Context, id int64) error
	List(ctx context.Context, filters map[string]interface{}, page, size int) ([]*domain.Tour, int, error)
	AddTourDate(ctx context.Context, tourDate *domain.TourDate) (int64, error)
	GetTourDates(ctx context.Context, tourID int64) ([]*domain.TourDate, error)
	GetTourDateByID(ctx context.Context, id int64) (*domain.TourDate, error)
	UpdateTourDate(ctx context.Context, tourDate *domain.TourDate) error
	DeleteTourDate(ctx context.Context, id int64) error
}

// HotelService интерфейс для работы с отелями
type HotelService interface {
	Create(ctx context.Context, hotel *domain.Hotel) (int64, error)
	GetByID(ctx context.Context, id int64) (*domain.Hotel, error)
	Update(ctx context.Context, hotel *domain.Hotel) error
	Delete(ctx context.Context, id int64) error
	List(ctx context.Context, filters map[string]interface{}, page, size int) ([]*domain.Hotel, int, error)
	AddRoom(ctx context.Context, room *domain.Room) (int64, error)
	GetRoomByID(ctx context.Context, id int64) (*domain.Room, error)
	UpdateRoom(ctx context.Context, room *domain.Room) error
	DeleteRoom(ctx context.Context, id int64) error
	ListRoomsByHotelID(ctx context.Context, hotelID int64) ([]*domain.Room, error)
}

// OrderService интерфейс для работы с заказами
type OrderService interface {
	Create(ctx context.Context, userID, tourID, tourDateID int64, roomID *int64, peopleCount int) (int64, error)
	GetByID(ctx context.Context, id int64) (*domain.Order, error)
	Update(ctx context.Context, order *domain.Order) error
	Delete(ctx context.Context, id int64) error
	ListByUserID(ctx context.Context, userID int64) ([]*domain.Order, error)
	List(ctx context.Context, filters map[string]interface{}, page, size int) ([]*domain.Order, int, error)
	UpdateStatus(ctx context.Context, id int64, status string) error
	CalculatePrice(ctx context.Context, tourID, tourDateID int64, roomID *int64, peopleCount int) (float64, error)
}

// SupportTicketService интерфейс для работы с тикетами тех-поддержки
type SupportTicketService interface {
	Create(ctx context.Context, userID int64, subject, message string) (int64, error)
	GetByID(ctx context.Context, id int64) (*domain.SupportTicket, error)
	Update(ctx context.Context, ticket *domain.SupportTicket) error
	Delete(ctx context.Context, id int64) error
	ListByUserID(ctx context.Context, userID int64) ([]*domain.SupportTicket, error)
	List(ctx context.Context, filters map[string]interface{}, page, size int) ([]*domain.SupportTicket, int, error)
	UpdateStatus(ctx context.Context, id int64, status string) error
	AddMessage(ctx context.Context, ticketID, userID int64, message string) (int64, error)
	GetMessages(ctx context.Context, ticketID int64) ([]*domain.TicketMessage, error)
	CloseTicket(ctx context.Context, id int64) error
}

// CityService интерфейс для работы с городами
type CityService interface {
	GetByID(ctx context.Context, id int64) (*domain.City, error)
	List(ctx context.Context, page, size int) ([]*domain.City, int, error)
	ListByCountryID(ctx context.Context, countryID int64) ([]*domain.City, error)
}

// CountryService интерфейс для работы со странами
type CountryService interface {
	GetByID(ctx context.Context, id int64) (*domain.Country, error)
	List(ctx context.Context, page, size int) ([]*domain.Country, int, error)
}
