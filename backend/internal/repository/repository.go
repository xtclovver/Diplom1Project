package repository

import (
	"context"

	"github.com/jmoiron/sqlx"
	"github.com/usedcvnt/Diplom1Project/backend/internal/domain"
)

// Repository представляет собой главный репозиторий, включающий все репозитории
type Repository struct {
	User          UserRepository
	Tour          TourRepository
	Hotel         HotelRepository
	Room          RoomRepository
	Order         OrderRepository
	SupportTicket SupportTicketRepository
}

// NewRepository создает новый экземпляр Repository
func NewRepository(db *sqlx.DB) *Repository {
	return &Repository{
		User:          NewUserRepository(db),
		Tour:          NewTourRepository(db),
		Hotel:         NewHotelRepository(db),
		Room:          NewRoomRepository(db),
		Order:         NewOrderRepository(db),
		SupportTicket: NewSupportTicketRepository(db),
	}
}

// UserRepository интерфейс для работы с пользователями
type UserRepository interface {
	Create(ctx context.Context, user *domain.User) (int64, error)
	GetByID(ctx context.Context, id int64) (*domain.User, error)
	GetByUsername(ctx context.Context, username string) (*domain.User, error)
	GetByEmail(ctx context.Context, email string) (*domain.User, error)
	Update(ctx context.Context, user *domain.User) error
	Delete(ctx context.Context, id int64) error
	List(ctx context.Context, offset, limit int) ([]*domain.User, error)
	Count(ctx context.Context) (int, error)
}

// TourRepository интерфейс для работы с турами
type TourRepository interface {
	Create(ctx context.Context, tour *domain.Tour) (int64, error)
	GetByID(ctx context.Context, id int64) (*domain.Tour, error)
	Update(ctx context.Context, tour *domain.Tour) error
	Delete(ctx context.Context, id int64) error
	List(ctx context.Context, filters map[string]interface{}, offset, limit int) ([]*domain.Tour, error)
	Count(ctx context.Context, filters map[string]interface{}) (int, error)
	AddTourDate(ctx context.Context, tourDate *domain.TourDate) (int64, error)
	GetTourDates(ctx context.Context, tourID int64) ([]*domain.TourDate, error)
	UpdateTourDate(ctx context.Context, tourDate *domain.TourDate) error
	DeleteTourDate(ctx context.Context, id int64) error
}

// HotelRepository интерфейс для работы с отелями
type HotelRepository interface {
	Create(ctx context.Context, hotel *domain.Hotel) (int64, error)
	GetByID(ctx context.Context, id int64) (*domain.Hotel, error)
	Update(ctx context.Context, hotel *domain.Hotel) error
	Delete(ctx context.Context, id int64) error
	List(ctx context.Context, filters map[string]interface{}, offset, limit int) ([]*domain.Hotel, error)
	Count(ctx context.Context, filters map[string]interface{}) (int, error)
}

// RoomRepository интерфейс для работы с номерами отелей
type RoomRepository interface {
	Create(ctx context.Context, room *domain.Room) (int64, error)
	GetByID(ctx context.Context, id int64) (*domain.Room, error)
	Update(ctx context.Context, room *domain.Room) error
	Delete(ctx context.Context, id int64) error
	ListByHotelID(ctx context.Context, hotelID int64) ([]*domain.Room, error)
}

// OrderRepository интерфейс для работы с заказами
type OrderRepository interface {
	Create(ctx context.Context, order *domain.Order) (int64, error)
	GetByID(ctx context.Context, id int64) (*domain.Order, error)
	Update(ctx context.Context, order *domain.Order) error
	Delete(ctx context.Context, id int64) error
	ListByUserID(ctx context.Context, userID int64) ([]*domain.Order, error)
	List(ctx context.Context, filters map[string]interface{}, offset, limit int) ([]*domain.Order, error)
	Count(ctx context.Context, filters map[string]interface{}) (int, error)
	UpdateStatus(ctx context.Context, id int64, status string) error
}

// SupportTicketRepository интерфейс для работы с тикетами тех-поддержки
type SupportTicketRepository interface {
	Create(ctx context.Context, ticket *domain.SupportTicket) (int64, error)
	GetByID(ctx context.Context, id int64) (*domain.SupportTicket, error)
	Update(ctx context.Context, ticket *domain.SupportTicket) error
	Delete(ctx context.Context, id int64) error
	ListByUserID(ctx context.Context, userID int64) ([]*domain.SupportTicket, error)
	List(ctx context.Context, filters map[string]interface{}, offset, limit int) ([]*domain.SupportTicket, error)
	Count(ctx context.Context, filters map[string]interface{}) (int, error)
	UpdateStatus(ctx context.Context, id int64, status string) error
	AddMessage(ctx context.Context, message *domain.TicketMessage) (int64, error)
	GetMessages(ctx context.Context, ticketID int64) ([]*domain.TicketMessage, error)
}
