package config

import (
	"encoding/json"
	"fmt"
	"os"
)

// Config структура для хранения конфигурации приложения
type Config struct {
	Server   ServerConfig   `json:"server"`
	Database DatabaseConfig `json:"database"`
	JWT      JWTConfig      `json:"jwt"`
	Redis    RedisConfig    `json:"redis"`
}

// ServerConfig настройки HTTP сервера
type ServerConfig struct {
	Port         string `json:"port"`
	ReadTimeout  int    `json:"read_timeout"`
	WriteTimeout int    `json:"write_timeout"`
}

// DatabaseConfig настройки базы данных
type DatabaseConfig struct {
	Driver   string `json:"driver"`
	Host     string `json:"host"`
	Port     string `json:"port"`
	Username string `json:"username"`
	Password string `json:"password"`
	DBName   string `json:"dbname"`
}

// JWTConfig настройки JWT токенов
type JWTConfig struct {
	Secret            string `json:"secret"`
	AccessExpiration  int    `json:"access_expiration"`  // в минутах
	RefreshExpiration int    `json:"refresh_expiration"` // в часах
}

// RedisConfig настройки Redis
type RedisConfig struct {
	Host     string `json:"host"`
	Port     string `json:"port"`
	Password string `json:"password"`
	DB       int    `json:"db"`
}

// LoadConfig загружает конфигурацию из файла
func LoadConfig(path string) (*Config, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("unable to open config file: %w", err)
	}
	defer file.Close()

	var config Config
	decoder := json.NewDecoder(file)
	if err := decoder.Decode(&config); err != nil {
		return nil, fmt.Errorf("unable to decode config JSON: %w", err)
	}

	return &config, nil
}

// GetDSN возвращает строку подключения к базе данных
func (c *DatabaseConfig) GetDSN() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		c.Username, c.Password, c.Host, c.Port, c.DBName)
}
