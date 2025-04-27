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

	// Проверка подключения к БД
	if err := db.Ping(); err != nil {
		log.Fatalf("Ошибка проверки подключения к базе данных: %s", err.Error())
	}
	log.Println("Успешное подключение к базе данных")

	// Проверка наличия таблицы пользователей
	var tableCount int
	err = db.Get(&tableCount, "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'users'")
	if err != nil {
		log.Fatalf("Ошибка проверки наличия таблицы пользователей: %s", err.Error())
	}

	if tableCount == 0 {
		log.Fatalf("Таблица пользователей не найдена в базе данных. Необходимо выполнить миграции.")
	}

	// Проверка наличия ролей пользователей
	var roleCount int
	err = db.Get(&roleCount, "SELECT COUNT(*) FROM roles")
	if err != nil {
		log.Printf("Ошибка проверки ролей пользователей: %s", err.Error())
	} else {
		log.Printf("В системе найдено %d ролей пользователей", roleCount)
	}

	// Подсчет количества пользователей в системе
	var userCount int
	err = db.Get(&userCount, "SELECT COUNT(*) FROM users")
	if err != nil {
		log.Printf("Ошибка подсчета пользователей: %s", err.Error())
	} else {
		log.Printf("В системе зарегистрировано %d пользователей", userCount)
	}

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
