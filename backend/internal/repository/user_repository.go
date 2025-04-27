package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"strings"

	"github.com/jmoiron/sqlx"
	"github.com/usedcvnt/Diplom1Project/backend/internal/domain"
)

// userRepository реализация UserRepository
type userRepository struct {
	db *sqlx.DB
}

// NewUserRepository создает новый экземпляр UserRepository
func NewUserRepository(db *sqlx.DB) UserRepository {
	return &userRepository{db: db}
}

// Create создает нового пользователя
func (r *userRepository) Create(ctx context.Context, user *domain.User) (int64, error) {
	query := `
		INSERT INTO users (username, password, email, full_name, phone, role_id)
		VALUES (?, ?, ?, ?, ?, ?)
	`

	log.Printf("[UserRepository] Попытка создания пользователя: %s, email: %s", user.Username, user.Email)

	result, err := r.db.ExecContext(
		ctx,
		query,
		user.Username,
		user.Password,
		user.Email,
		user.FullName,
		user.Phone,
		user.RoleID,
	)
	if err != nil {
		// Обработка ошибок дубликатов
		if strings.Contains(err.Error(), "Duplicate entry") {
			if strings.Contains(err.Error(), "username") {
				log.Printf("[UserRepository] Ошибка: пользователь с именем %s уже существует", user.Username)
				return 0, fmt.Errorf("пользователь с таким именем уже существует")
			}
			if strings.Contains(err.Error(), "email") {
				log.Printf("[UserRepository] Ошибка: пользователь с email %s уже существует", user.Email)
				return 0, fmt.Errorf("пользователь с таким email уже существует")
			}
		}
		log.Printf("[UserRepository] Ошибка создания пользователя: %v", err)
		return 0, fmt.Errorf("не удалось создать пользователя: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		log.Printf("[UserRepository] Ошибка получения ID нового пользователя: %v", err)
		return 0, fmt.Errorf("не удалось получить ID нового пользователя: %w", err)
	}

	log.Printf("[UserRepository] Пользователь успешно создан с ID: %d", id)
	return id, nil
}

// GetByID получает пользователя по ID
func (r *userRepository) GetByID(ctx context.Context, id int64) (*domain.User, error) {
	query := `
		SELECT id, username, password, email, full_name, phone, role_id, created_at
		FROM users
		WHERE id = ?
	`

	var user domain.User
	err := r.db.GetContext(ctx, &user, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("user not found: %w", err)
		}
		return nil, fmt.Errorf("failed to get user by id: %w", err)
	}

	return &user, nil
}

// GetByUsername получает пользователя по имени пользователя
func (r *userRepository) GetByUsername(ctx context.Context, username string) (*domain.User, error) {
	query := `
		SELECT id, username, password, email, full_name, phone, role_id, created_at
		FROM users
		WHERE username = ?
	`

	log.Printf("[UserRepository] Поиск пользователя по username: %s", username)

	var user domain.User
	err := r.db.GetContext(ctx, &user, query, username)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			log.Printf("[UserRepository] Пользователь с username %s не найден", username)
			return nil, fmt.Errorf("пользователь не найден: %w", err)
		}
		log.Printf("[UserRepository] Ошибка поиска пользователя по username: %v", err)
		return nil, fmt.Errorf("ошибка получения пользователя по имени: %w", err)
	}

	log.Printf("[UserRepository] Пользователь с username %s найден, ID: %d", username, user.ID)
	return &user, nil
}

// GetByEmail получает пользователя по email
func (r *userRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `
		SELECT id, username, password, email, full_name, phone, role_id, created_at
		FROM users
		WHERE email = ?
	`

	log.Printf("[UserRepository] Поиск пользователя по email: %s", email)

	var user domain.User
	err := r.db.GetContext(ctx, &user, query, email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			log.Printf("[UserRepository] Пользователь с email %s не найден", email)
			return nil, fmt.Errorf("пользователь не найден: %w", err)
		}
		log.Printf("[UserRepository] Ошибка поиска пользователя по email: %v", err)
		return nil, fmt.Errorf("ошибка получения пользователя по email: %w", err)
	}

	log.Printf("[UserRepository] Пользователь с email %s найден, ID: %d", email, user.ID)
	return &user, nil
}

// Update обновляет данные пользователя
func (r *userRepository) Update(ctx context.Context, user *domain.User) error {
	// Проверяем, нужно ли обновлять пароль
	var query string
	var args []interface{}

	if len(user.Password) > 0 {
		// Если пароль предоставлен, обновляем его тоже
		query = `
			UPDATE users
			SET username = ?, email = ?, password = ?, full_name = ?, phone = ?, role_id = ?
			WHERE id = ?
		`
		args = []interface{}{
			user.Username,
			user.Email,
			user.Password,
			user.FullName,
			user.Phone,
			user.RoleID,
			user.ID,
		}
		log.Printf("[UserRepository] Обновление пользователя ID=%d с паролем (длина пароля: %d)",
			user.ID, len(user.Password))
	} else {
		// Если пароль пустой, не обновляем его
		query = `
			UPDATE users
			SET username = ?, email = ?, full_name = ?, phone = ?, role_id = ?
			WHERE id = ?
		`
		args = []interface{}{
			user.Username,
			user.Email,
			user.FullName,
			user.Phone,
			user.RoleID,
			user.ID,
		}
		log.Printf("[UserRepository] Обновление пользователя ID=%d без пароля", user.ID)
	}

	result, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		log.Printf("[UserRepository] Ошибка обновления пользователя: %v", err)
		return fmt.Errorf("ошибка обновления пользователя: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	log.Printf("[UserRepository] Обновлен пользователь ID=%d, затронуто строк: %d", user.ID, rowsAffected)

	return nil
}

// Delete удаляет пользователя
func (r *userRepository) Delete(ctx context.Context, id int64) error {
	query := "DELETE FROM users WHERE id = ?"

	_, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	return nil
}

// List возвращает список пользователей с пагинацией
func (r *userRepository) List(ctx context.Context, offset, limit int) ([]*domain.User, error) {
	query := `
		SELECT id, username, email, full_name, phone, role_id, created_at
		FROM users
		ORDER BY id
		LIMIT ? OFFSET ?
	`

	users := make([]*domain.User, 0)
	err := r.db.SelectContext(ctx, &users, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list users: %w", err)
	}

	return users, nil
}

// Count возвращает общее количество пользователей
func (r *userRepository) Count(ctx context.Context) (int, error) {
	query := "SELECT COUNT(*) FROM users"

	var count int
	err := r.db.GetContext(ctx, &count, query)
	if err != nil {
		return 0, fmt.Errorf("failed to count users: %w", err)
	}

	return count, nil
}
