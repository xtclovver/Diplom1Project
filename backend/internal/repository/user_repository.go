package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

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
		return 0, fmt.Errorf("failed to create user: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("failed to get last insert id: %w", err)
	}

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

	var user domain.User
	err := r.db.GetContext(ctx, &user, query, username)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("user not found: %w", err)
		}
		return nil, fmt.Errorf("failed to get user by username: %w", err)
	}

	return &user, nil
}

// GetByEmail получает пользователя по email
func (r *userRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `
		SELECT id, username, password, email, full_name, phone, role_id, created_at
		FROM users
		WHERE email = ?
	`

	var user domain.User
	err := r.db.GetContext(ctx, &user, query, email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("user not found: %w", err)
		}
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}

	return &user, nil
}

// Update обновляет данные пользователя
func (r *userRepository) Update(ctx context.Context, user *domain.User) error {
	query := `
		UPDATE users
		SET username = ?, email = ?, full_name = ?, phone = ?, role_id = ?
		WHERE id = ?
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		user.Username,
		user.Email,
		user.FullName,
		user.Phone,
		user.RoleID,
		user.ID,
	)
	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

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
