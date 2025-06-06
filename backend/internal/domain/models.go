package domain

import (
	"time"
)

// Country представляет страну
type Country struct {
	ID   int64  `db:"id" json:"id"`
	Name string `db:"name" json:"name"`
	Code string `db:"code" json:"code"`
}

// City представляет город
type City struct {
	ID        int64    `db:"id" json:"id"`
	CountryID int64    `db:"country_id" json:"-"` // Скроем из JSON здесь, так как будет внутри Country
	Name      string   `db:"name" json:"name"`
	Country   *Country `json:"country,omitempty"` // Добавляем вложенную страну
}

// Hotel представляет отель
type Hotel struct {
	ID          int64     `db:"id" json:"id"`
	CityID      int64     `db:"city_id" json:"city_id"`
	Name        string    `db:"name" json:"name"`
	Description string    `db:"description" json:"description"`
	Address     string    `db:"address" json:"address"`
	Category    int       `db:"category" json:"category"`
	ImageURL    string    `db:"image_url" json:"image_url"`
	IsActive    bool      `db:"is_active" json:"is_active"`
	CreatedAt   time.Time `db:"created_at" json:"created_at"`
}

// Room представляет номер в отеле
type Room struct {
	ID          int64     `db:"id" json:"id"`
	HotelID     int64     `db:"hotel_id" json:"hotel_id"`
	Description string    `db:"description" json:"description"`
	Beds        int       `db:"beds" json:"beds"`
	Price       float64   `db:"price" json:"price"`
	ImageURL    string    `db:"image_url" json:"image_url"`
	CreatedAt   time.Time `db:"created_at,omitempty" json:"created_at,omitempty"`
}

// Tour представляет тур
type Tour struct {
	ID          int64     `db:"id" json:"id"`
	CityID      int64     `db:"city_id" json:"city_id"`
	Name        string    `db:"name" json:"name"`
	Description string    `db:"description" json:"description"`
	BasePrice   float64   `db:"base_price" json:"base_price"`
	ImageURL    string    `db:"image_url" json:"image_url"`
	Duration    int       `db:"duration" json:"duration"`
	IsActive    bool      `db:"is_active" json:"is_active"`
	CreatedAt   time.Time `db:"created_at" json:"created_at"`

	// Поля для отображения (не сохраняются в БД) - УДАЛЯЕМ СТАРЫЕ ПОЛЯ
	// City     string `db:"-" json:"city,omitempty"`
	// Country  string `db:"-" json:"country,omitempty"`
	// Location string `db:"-" json:"location,omitempty"`
	City *City `json:"city,omitempty"` // Добавляем вложенный город

	// Связанные данные
	TourDates []*TourDate `json:"tour_dates,omitempty"`
	Hotels    []*Hotel    `json:"hotels,omitempty"`
}

// TourDate представляет доступную дату тура
type TourDate struct {
	ID            int64     `db:"id" json:"id"`
	TourID        int64     `db:"tour_id" json:"tour_id"`
	StartDate     time.Time `db:"start_date" json:"start_date"`
	EndDate       time.Time `db:"end_date" json:"end_date"`
	Availability  int       `db:"availability" json:"availability"`
	PriceModifier float64   `db:"price_modifier" json:"price_modifier"`
}

// Role представляет роль пользователя
type Role struct {
	ID   int64  `db:"id" json:"id"`
	Name string `db:"name" json:"name"`
}

// User представляет пользователя системы
type User struct {
	ID        int64     `db:"id" json:"id"`
	Username  string    `db:"username" json:"username"`
	Password  string    `db:"password" json:"-"`
	Email     string    `db:"email" json:"email"`
	FirstName string    `db:"first_name" json:"first_name"`
	LastName  string    `db:"last_name" json:"last_name"`
	FullName  string    `db:"full_name" json:"full_name"`
	Phone     string    `db:"phone" json:"phone"`
	BirthDate string    `db:"birth_date" json:"birth_date"`
	RoleID    int64     `db:"role_id" json:"role_id"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

// OrderStatus представляет статус заказа
type OrderStatus string

const (
	OrderStatusPending   OrderStatus = "pending"
	OrderStatusConfirmed OrderStatus = "confirmed"
	OrderStatusPaid      OrderStatus = "paid"
	OrderStatusCancelled OrderStatus = "cancelled"
	OrderStatusCompleted OrderStatus = "completed"
)

// Order представляет заказ
type Order struct {
	ID          int64     `db:"id" json:"id"`
	UserID      int64     `db:"user_id" json:"user_id"`
	TourID      int64     `db:"tour_id" json:"tour_id"`
	TourDateID  int64     `db:"tour_date_id" json:"tour_date_id"`
	RoomID      *int64    `db:"room_id" json:"room_id"`
	PeopleCount int       `db:"people_count" json:"people_count"`
	TotalPrice  float64   `db:"total_price" json:"total_price"`
	Status      string    `db:"status" json:"status"`
	CreatedAt   time.Time `db:"created_at" json:"created_at"`
}

// TicketStatus представляет статус тикета поддержки
type TicketStatus string

const (
	TicketStatusOpen       TicketStatus = "open"
	TicketStatusInProgress TicketStatus = "in_progress"
	TicketStatusClosed     TicketStatus = "closed"
)

// SupportTicket представляет тикет в тех-поддержку
type SupportTicket struct {
	ID             int64     `db:"id" json:"id"`
	UserID         int64     `db:"user_id" json:"user_id"`
	Subject        string    `db:"subject" json:"subject"`
	Status         string    `db:"status" json:"status"`
	CreatedAt      time.Time `db:"created_at" json:"created_at"`
	ClosedAt       time.Time `db:"closed_at" json:"closed_at,omitempty"`
	InitialMessage string    `json:"initial_message,omitempty"`
}

// TicketMessage представляет сообщение в тикете тех-поддержки
type TicketMessage struct {
	ID        int64     `db:"id" json:"id"`
	TicketID  int64     `db:"ticket_id" json:"ticket_id"`
	UserID    int64     `db:"user_id" json:"user_id"`
	Message   string    `db:"message" json:"message"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

// TourFilter содержит параметры для фильтрации туров
type TourFilter struct {
	CityID    *int     `json:"city_id"`
	CountryID *int     `json:"country_id"`
	PriceMin  *float64 `json:"price_min"`
	PriceMax  *float64 `json:"price_max"`
	Limit     int      `json:"limit"`
	Offset    int      `json:"offset"`
}
