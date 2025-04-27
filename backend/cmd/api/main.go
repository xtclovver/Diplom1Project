package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/usedcvnt/Diplom1Project/backend/internal/config"
	"github.com/usedcvnt/Diplom1Project/backend/internal/handler"
	"github.com/usedcvnt/Diplom1Project/backend/internal/repository"
	"github.com/usedcvnt/Diplom1Project/backend/internal/service"
	"github.com/usedcvnt/Diplom1Project/backend/pkg/auth"
	"github.com/usedcvnt/Diplom1Project/backend/pkg/database"
)

func main() {
	// Загрузка конфигурации
	cfg, err := config.LoadConfig("configs/config.json")
	if err != nil {
		log.Fatalf("Ошибка загрузки конфигурации: %s", err.Error())
	}

	// Создание подключения к базе данных
	db, err := database.NewMySQLConnection(cfg.Database.GetDSN())
	if err != nil {
		log.Fatalf("Ошибка подключения к базе данных: %s", err.Error())
	}
	defer db.Close()

	// Инициализация менеджера JWT токенов
	tokenManager := auth.NewJWTManager(cfg.JWT)

	// Инициализация репозиториев
	repos := repository.NewRepository(db)

	// Инициализация сервисов
	services := service.NewService(repos, tokenManager)

	// Инициализация обработчиков
	handlers := handler.NewHandler(services, tokenManager)

	// Инициализация WebSocket хаба
	handler.InitWebSocketHub()

	// Инициализация HTTP сервера
	router := handlers.InitRoutes()
	server := &http.Server{
		Addr:           ":" + cfg.Server.Port,
		Handler:        router,
		ReadTimeout:    time.Duration(cfg.Server.ReadTimeout) * time.Second,
		WriteTimeout:   time.Duration(cfg.Server.WriteTimeout) * time.Second,
		MaxHeaderBytes: 1 << 20, // 1 MB
	}

	// Запуск сервера в отдельной горутине
	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Ошибка запуска HTTP сервера: %s", err.Error())
		}
	}()

	log.Printf("Сервер запущен на порту %s", cfg.Server.Port)

	// Канал для получения сигнала о завершении
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	// Ожидание сигнала
	<-quit
	log.Println("Завершение работы сервера...")

	// Установка таймаута для graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Остановка сервера
	if err := server.Shutdown(ctx); err != nil {
		log.Printf("Ошибка при остановке сервера: %s", err.Error())
	}

	log.Println("Сервер остановлен")
}
