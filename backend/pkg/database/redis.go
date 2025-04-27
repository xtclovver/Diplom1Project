package database

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
	"github.com/usedcvnt/Diplom1Project/backend/internal/config"
)

// NewRedisClient создает новое подключение к Redis
func NewRedisClient(cfg config.RedisConfig) (*redis.Client, error) {
	// Создание клиента Redis
	client := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%d", cfg.Host, cfg.Port),
		Password: cfg.Password,
		DB:       cfg.DB,
	})

	// Проверка соединения
	ctx := context.Background()
	_, err := client.Ping(ctx).Result()
	if err != nil {
		return nil, fmt.Errorf("не удалось подключиться к Redis: %w", err)
	}

	return client, nil
}
