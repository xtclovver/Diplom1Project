package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"github.com/jmoiron/sqlx"
	"github.com/usedcvnt/Diplom1Project/backend/internal/domain"
)

// tourRepository реализация TourRepository из repository.go
type tourRepository struct {
	db *sqlx.DB
}

// NewTourRepository создает новый экземпляр TourRepository
func NewTourRepository(db *sqlx.DB) TourRepository {
	return &tourRepository{db: db}
}

// Create создает новый тур
func (r *tourRepository) Create(ctx context.Context, tour *domain.Tour) (int64, error) {
	query := `
		INSERT INTO tours (city_id, name, description, base_price, image_url, duration, is_active)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`

	result, err := r.db.ExecContext(
		ctx,
		query,
		tour.CityID,
		tour.Name,
		tour.Description,
		tour.BasePrice,
		tour.ImageURL,
		tour.Duration,
		tour.IsActive,
	)

	if err != nil {
		return 0, fmt.Errorf("ошибка при создании тура: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("ошибка при получении ID созданного тура: %w", err)
	}

	return id, nil
}

// GetByID получает тур по ID вместе со связанными данными (город, страна, даты, отели)
func (r *tourRepository) GetByID(ctx context.Context, id int64) (*domain.Tour, error) {
	// Больше не нужна временная структура, будем сканировать напрямую в domain.Tour

	// Обновленный запрос с псевдонимами для вложенных структур
	query := `
		SELECT
			t.id, t.city_id, t.name, t.description, t.base_price, t.image_url, t.duration, t.is_active, t.created_at,
			c.id AS "city.id",
			c.name AS "city.name",
			co.id AS "city.country.id",
			co.name AS "city.country.name",
			co.code AS "city.country.code"
		FROM tours t
		LEFT JOIN cities c ON t.city_id = c.id        -- Используем LEFT JOIN на случай, если город не указан
		LEFT JOIN countries co ON c.country_id = co.id -- Используем LEFT JOIN на случай, если страна не указана
		WHERE t.id = ?
	`

	var tour domain.Tour // Сканируем напрямую в основную структуру
	err := r.db.GetContext(ctx, &tour, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("тур с ID %d не найден", id)
		}
		return nil, fmt.Errorf("ошибка при поиске тура: %w", err)
	}

	// Данные города и страны теперь заполнены автоматически sqlx

	// Получаем даты тура
	tourDates, err := r.GetTourDates(ctx, tour.ID)
	if err != nil {
		// Не возвращаем ошибку, если даты не найдены, просто оставляем поле пустым
		// Можно добавить логирование при необходимости
	}
	tour.TourDates = tourDates

	// Получаем отели в городе тура
	hotels, err := r.getHotelsByCityID(ctx, tour.CityID)
	if err != nil {
		// Логируем ошибку, чтобы понять, почему отели не загрузились
		fmt.Printf("WARN: Failed to get hotels for city %d (tour %d): %v\n", tour.CityID, id, err) // Используйте ваш логгер
		// Не прерываем выполнение, но оставляем tour.Hotels как nil или пустой срез
		// В качестве альтернативы, можно было бы вернуть ошибку:
		// return nil, fmt.Errorf("ошибка при получении отелей для тура: %w", err)
	}
	tour.Hotels = hotels // Присваиваем то, что вернулось (может быть пустым срезом)

	return &tour, nil
}

// getHotelsByCityID вспомогательный метод для получения отелей по ID города
func (r *tourRepository) getHotelsByCityID(ctx context.Context, cityID int64) ([]*domain.Hotel, error) {
	query := `
		SELECT id, city_id, name, description, address, category, image_url, is_active, created_at
		FROM hotels
		WHERE city_id = ? AND is_active = true
	`
	var hotels []*domain.Hotel
	err := r.db.SelectContext(ctx, &hotels, query, cityID)
	if err != nil {
		// Не возвращаем sql.ErrNoRows как ошибку, просто пустой список
		if err == sql.ErrNoRows {
			return []*domain.Hotel{}, nil
		}
		return nil, fmt.Errorf("ошибка при получении отелей для города ID %d: %w", cityID, err)
	}
	return hotels, nil
}

// Update обновляет информацию о туре
func (r *tourRepository) Update(ctx context.Context, tour *domain.Tour) error {
	query := `
		UPDATE tours 
		SET city_id = ?, name = ?, description = ?, base_price = ?, image_url = ?, duration = ?, is_active = ?
		WHERE id = ?
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		tour.CityID,
		tour.Name,
		tour.Description,
		tour.BasePrice,
		tour.ImageURL,
		tour.Duration,
		tour.IsActive,
		tour.ID,
	)

	if err != nil {
		return fmt.Errorf("ошибка при обновлении тура: %w", err)
	}

	return nil
}

// Delete удаляет тур по ID
func (r *tourRepository) Delete(ctx context.Context, id int64) error {
	query := "DELETE FROM tours WHERE id = ?"

	_, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("ошибка при удалении тура: %w", err)
	}

	return nil
}

// List возвращает список туров с фильтрацией и информацией о городе/стране
func (r *tourRepository) List(ctx context.Context, filters map[string]interface{}, page, size int) ([]*domain.Tour, error) {
	fmt.Printf("DEBUG: Received filters in Repository List: %#v\n", filters) // Добавляем логирование полученных фильтров
	offset := (page - 1) * size
	limit := size

	selectFields := `
		DISTINCT -- Используем DISTINCT, если будет JOIN с tour_dates
		t.id, t.city_id, t.name, t.description, t.base_price, t.image_url, t.duration, t.is_active, t.created_at,
		c.id AS "city.id",
		c.name AS "city.name",
		co.id AS "city.country.id",
		co.name AS "city.country.name",
		co.code AS "city.country.code"
	`
	fromClause := `
		FROM tours t
		LEFT JOIN cities c ON t.city_id = c.id
		LEFT JOIN countries co ON c.country_id = co.id
	`
	joinClause := "" // Инициализируем пустой JOIN

	var conditions []string
	var args []interface{}
	needsDateJoin := false // Флаг для определения необходимости JOIN с tour_dates

	// Активные туры по умолчанию
	conditions = append(conditions, "t.is_active = true")

	// Обработка фильтров
	if filters != nil {
		if cityID, ok := filters["city_id"]; ok {
			conditions = append(conditions, "t.city_id = ?")
			args = append(args, cityID)
		}
		if countryID, ok := filters["country_id"]; ok {
			conditions = append(conditions, "c.country_id = ?")
			args = append(args, countryID)
		}
		if priceMin, ok := filters["price_min"]; ok {
			conditions = append(conditions, "t.base_price >= ?")
			args = append(args, priceMin)
		}
		if priceMax, ok := filters["price_max"]; ok {
			conditions = append(conditions, "t.base_price <= ?")
			args = append(args, priceMax)
		}
		// Обновленный поиск по названию и описанию (регистронезависимый)
		if searchQuery, ok := filters["search_query"]; ok && searchQuery.(string) != "" {
			searchPattern := "%" + strings.ToLower(searchQuery.(string)) + "%"
			conditions = append(conditions, "(LOWER(t.name) LIKE ? OR LOWER(t.description) LIKE ?)")
			args = append(args, searchPattern, searchPattern)
		}
		// Фильтр по продолжительности
		if durationMin, ok := filters["duration_min"]; ok {
			conditions = append(conditions, "t.duration >= ?")
			args = append(args, durationMin)
		}
		if durationMax, ok := filters["duration_max"]; ok {
			conditions = append(conditions, "t.duration <= ?")
			args = append(args, durationMax)
		}
		// Фильтры по дате
		if startDateAfter, ok := filters["start_date_after"]; ok {
			conditions = append(conditions, "td.start_date >= ?")
			args = append(args, startDateAfter)
			needsDateJoin = true
		}
		if startDateBefore, ok := filters["start_date_before"]; ok {
			conditions = append(conditions, "td.start_date <= ?")
			args = append(args, startDateBefore)
			needsDateJoin = true
		}
	}

	// Добавляем JOIN с tour_dates, если необходимо
	if needsDateJoin {
		joinClause = " LEFT JOIN tour_dates td ON t.id = td.tour_id "
	}

	// Формируем WHERE clause
	whereClause := ""
	if len(conditions) > 0 {
		whereClause = " WHERE " + strings.Join(conditions, " AND ")
	}

	// Формируем ORDER BY clause
	orderByClause := " ORDER BY t.created_at DESC" // Сортировка по умолчанию
	if sortBy, ok := filters["sort_by"].(string); ok {
		if sortOrder, ok := filters["sort_order"].(string); ok {
			// Проверяем, что sortOrder 'asc' или 'desc' (уже сделано в хендлере, но для безопасности)
			if sortOrder == "asc" || sortOrder == "desc" {
				// sortBy уже содержит проверенное имя поля из хендлера (e.g., "t.base_price")
				orderByClause = fmt.Sprintf(" ORDER BY %s %s", sortBy, strings.ToUpper(sortOrder))
			}
		}
	}

	// Формируем LIMIT и OFFSET
	limitOffsetClause := " LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	// Собираем полный запрос
	query := "SELECT " + selectFields + fromClause + joinClause + whereClause + orderByClause + limitOffsetClause

	var tours []*domain.Tour // Сканируем напрямую в слайс domain.Tour
	err := r.db.SelectContext(ctx, &tours, query, args...)
	if err != nil {
		// Добавим вывод самого запроса и аргументов для отладки
		fmt.Printf("DEBUG: Error executing List query: %v\nQuery: %s\nArgs: %v\n", err, query, args)
		return nil, fmt.Errorf("ошибка при поиске туров: %w", err)
	}

	// Даты и отели для списка по-прежнему не загружаем для производительности

	return tours, nil
}

// Count возвращает количество туров с учетом фильтрации
func (r *tourRepository) Count(ctx context.Context, filters map[string]interface{}) (int, error) {
	fmt.Printf("DEBUG: Received filters in Repository Count: %#v\n", filters) // Добавляем логирование полученных фильтров
	selectClause := "SELECT COUNT(DISTINCT t.id)"                             // Считаем уникальные ID туров
	fromClause := `
		FROM tours t
		LEFT JOIN cities c ON t.city_id = c.id -- Используем LEFT JOIN для консистентности с List
		LEFT JOIN countries co ON c.country_id = co.id -- Добавляем JOIN с countries для фильтрации по country_id
	`
	joinClause := "" // Инициализируем пустой JOIN для дат

	var conditions []string
	var args []interface{}
	needsDateJoin := false // Флаг для определения необходимости JOIN с tour_dates

	// Активные туры по умолчанию
	conditions = append(conditions, "t.is_active = true")

	// Обработка фильтров (аналогично List)
	if filters != nil {
		if cityID, ok := filters["city_id"]; ok {
			conditions = append(conditions, "t.city_id = ?")
			args = append(args, cityID)
		}
		if countryID, ok := filters["country_id"]; ok {
			// Условие теперь применяется к co (countries)
			conditions = append(conditions, "co.id = ?") // Используем co.id после JOIN с countries
			args = append(args, countryID)
		}
		if priceMin, ok := filters["price_min"]; ok {
			conditions = append(conditions, "t.base_price >= ?")
			args = append(args, priceMin)
		}
		if priceMax, ok := filters["price_max"]; ok {
			conditions = append(conditions, "t.base_price <= ?")
			args = append(args, priceMax)
		}
		// Обновленный поиск по названию и описанию (регистронезависимый)
		if searchQuery, ok := filters["search_query"]; ok && searchQuery.(string) != "" {
			searchPattern := "%" + strings.ToLower(searchQuery.(string)) + "%"
			conditions = append(conditions, "(LOWER(t.name) LIKE ? OR LOWER(t.description) LIKE ?)")
			args = append(args, searchPattern, searchPattern)
		}
		// Фильтр по продолжительности
		if durationMin, ok := filters["duration_min"]; ok {
			conditions = append(conditions, "t.duration >= ?")
			args = append(args, durationMin)
		}
		if durationMax, ok := filters["duration_max"]; ok {
			conditions = append(conditions, "t.duration <= ?")
			args = append(args, durationMax)
		}
		// Фильтры по дате
		if startDateAfter, ok := filters["start_date_after"]; ok {
			conditions = append(conditions, "td.start_date >= ?")
			args = append(args, startDateAfter)
			needsDateJoin = true
		}
		if startDateBefore, ok := filters["start_date_before"]; ok {
			conditions = append(conditions, "td.start_date <= ?")
			args = append(args, startDateBefore)
			needsDateJoin = true
		}
	}

	// Добавляем JOIN с tour_dates, если необходимо
	if needsDateJoin {
		joinClause = " LEFT JOIN tour_dates td ON t.id = td.tour_id "
	}

	// Формируем WHERE clause
	whereClause := ""
	if len(conditions) > 0 {
		whereClause = " WHERE " + strings.Join(conditions, " AND ")
	}

	// Собираем полный запрос
	query := selectClause + fromClause + joinClause + whereClause

	var count int
	err := r.db.GetContext(ctx, &count, query, args...)
	if err != nil {
		// Добавим вывод самого запроса и аргументов для отладки
		fmt.Printf("DEBUG: Error executing Count query: %v\nQuery: %s\nArgs: %v\n", err, query, args)
		return 0, fmt.Errorf("ошибка при подсчете туров: %w", err)
	}

	return count, nil
}

// AddTourDate добавляет дату проведения тура
func (r *tourRepository) AddTourDate(ctx context.Context, tourDate *domain.TourDate) (int64, error) {
	query := `
		INSERT INTO tour_dates (tour_id, start_date, end_date, availability)
		VALUES (?, ?, ?, ?)
	`

	result, err := r.db.ExecContext(
		ctx,
		query,
		tourDate.TourID,
		tourDate.StartDate,
		tourDate.EndDate,
		tourDate.Availability,
	)

	if err != nil {
		return 0, fmt.Errorf("ошибка при добавлении даты тура: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("ошибка при получении ID даты тура: %w", err)
	}

	return id, nil
}

// GetTourDates возвращает список доступных дат тура
func (r *tourRepository) GetTourDates(ctx context.Context, tourID int64) ([]*domain.TourDate, error) {
	query := `
		SELECT id, tour_id, start_date, end_date, availability, price_modifier
		FROM tour_dates
		WHERE tour_id = ?
	`

	var tourDates []*domain.TourDate
	err := r.db.SelectContext(ctx, &tourDates, query, tourID)
	if err != nil {
		return nil, fmt.Errorf("ошибка при получении дат тура: %w", err)
	}

	return tourDates, nil
}

// GetTourDateByID возвращает дату тура по ID
func (r *tourRepository) GetTourDateByID(ctx context.Context, id int64) (*domain.TourDate, error) {
	query := `
		SELECT id, tour_id, start_date, end_date, availability, price_modifier
		FROM tour_dates
		WHERE id = ?
	`

	var tourDate domain.TourDate
	err := r.db.GetContext(ctx, &tourDate, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("дата тура с ID %d не найдена", id)
		}
		return nil, fmt.Errorf("ошибка при поиске даты тура: %w", err)
	}

	return &tourDate, nil
}

// UpdateTourDate обновляет информацию о дате тура
func (r *tourRepository) UpdateTourDate(ctx context.Context, tourDate *domain.TourDate) error {
	query := `
		UPDATE tour_dates 
		SET tour_id = ?, start_date = ?, end_date = ?, availability = ?, price_modifier = ?
		WHERE id = ?
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		tourDate.TourID,
		tourDate.StartDate,
		tourDate.EndDate,
		tourDate.Availability,
		tourDate.PriceModifier,
		tourDate.ID,
	)

	if err != nil {
		return fmt.Errorf("ошибка при обновлении даты тура: %w", err)
	}

	return nil
}

// UpdateTourDateAvailabilityTx обновляет доступность мест для даты тура в рамках транзакции
func (r *tourRepository) UpdateTourDateAvailabilityTx(ctx context.Context, tx Tx, tourDateID int64, availability int) error {
	query := `
		UPDATE tour_dates 
		SET availability = ?
		WHERE id = ?
	`

	sqlxTx := tx.(*sqlxTx)

	_, err := sqlxTx.tx.ExecContext(
		ctx,
		query,
		availability,
		tourDateID,
	)

	if err != nil {
		return fmt.Errorf("ошибка при обновлении доступности мест даты тура в транзакции: %w", err)
	}

	return nil
}

// DeleteTourDate удаляет дату тура по ID
func (r *tourRepository) DeleteTourDate(ctx context.Context, id int64) error {
	query := "DELETE FROM tour_dates WHERE id = ?"

	_, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("ошибка при удалении даты тура: %w", err)
	}

	return nil
}
