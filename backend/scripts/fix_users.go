package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
	"golang.org/x/crypto/bcrypt"
)

// Подключаемся к БД
func connectDB() (*sql.DB, error) {
	dbUser := os.Getenv("DB_USER")
	dbPass := os.Getenv("DB_PASSWORD")
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbName := os.Getenv("DB_NAME")

	if dbUser == "" || dbName == "" {
		// Используем значения по умолчанию, если переменные не установлены
		dbUser = "root"
		dbPass = "123123"
		dbHost = "localhost"
		dbPort = "3306"
		dbName = "tour_agency"
	}

	if dbPort == "" {
		dbPort = "3306"
	}

	if dbHost == "" {
		dbHost = "localhost"
	}

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true", dbUser, dbPass, dbHost, dbPort, dbName)
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}

	err = db.Ping()
	if err != nil {
		return nil, err
	}

	return db, nil
}

// Хеширование пароля
func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

func main() {
	// Подключаемся к БД
	db, err := connectDB()
	if err != nil {
		log.Fatalf("Ошибка подключения к БД: %v", err)
	}
	defer db.Close()

	log.Println("Успешное подключение к базе данных")

	// Проверяем наличие таблицы пользователей
	var tableCount int
	err = db.QueryRow("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'users'").Scan(&tableCount)
	if err != nil {
		log.Fatalf("Ошибка проверки наличия таблицы пользователей: %v", err)
	}

	if tableCount == 0 {
		log.Fatalf("Таблица пользователей не найдена в базе данных")
	}

	// Подсчет пользователей с пустыми паролями
	var emptyPasswordCount int
	err = db.QueryRow("SELECT COUNT(*) FROM users WHERE password = '' OR password IS NULL").Scan(&emptyPasswordCount)
	if err != nil {
		log.Fatalf("Ошибка подсчета пользователей с пустыми паролями: %v", err)
	}

	log.Printf("Найдено %d пользователей с пустыми паролями", emptyPasswordCount)

	// Получаем всех пользователей
	rows, err := db.Query("SELECT id, username, email, password FROM users")
	if err != nil {
		log.Fatalf("Ошибка получения списка пользователей: %v", err)
	}
	defer rows.Close()

	type User struct {
		ID       int
		Username string
		Email    string
		Password string
	}

	var users []User
	for rows.Next() {
		var user User
		if err := rows.Scan(&user.ID, &user.Username, &user.Email, &user.Password); err != nil {
			log.Printf("Ошибка сканирования пользователя: %v", err)
			continue
		}
		users = append(users, user)
	}

	log.Printf("Всего пользователей в системе: %d", len(users))

	// Проверяем и исправляем пользователей с пустыми паролями
	for _, user := range users {
		if user.Password == "" {
			log.Printf("Пользователь %s (ID: %d) имеет пустой пароль", user.Username, user.ID)

			// Создаем новый пароль (можно задать свою логику, например, username + "123")
			newPassword := user.Username + "123"
			hashedPassword, err := hashPassword(newPassword)
			if err != nil {
				log.Printf("Ошибка хеширования пароля для пользователя %s: %v", user.Username, err)
				continue
			}

			// Обновляем пароль
			_, err = db.Exec("UPDATE users SET password = ? WHERE id = ?", hashedPassword, user.ID)
			if err != nil {
				log.Printf("Ошибка обновления пароля для пользователя %s: %v", user.Username, err)
				continue
			}

			log.Printf("Пароль для пользователя %s (ID: %d) успешно обновлен на '%s'", user.Username, user.ID, newPassword)
		} else {
			// Проверяем валидность хеша пароля
			if len(user.Password) < 6 {
				log.Printf("Пользователь %s (ID: %d) имеет слишком короткий хеш пароля: %s",
					user.Username, user.ID, user.Password)
			}
		}
	}

	log.Println("Проверка пользователей завершена")
}
