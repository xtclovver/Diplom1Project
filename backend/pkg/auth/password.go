package auth

import (
	"log"

	"golang.org/x/crypto/bcrypt"
)

// Стоимость хеширования bcrypt (больше = безопаснее, но медленнее)
const bcryptCost = 12

// HashPassword хеширует пароль используя bcrypt
func HashPassword(password string) (string, error) {
	log.Printf("[Auth] Хеширование пароля (длина: %d)", len(password))
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcryptCost)
	if err != nil {
		log.Printf("[Auth] Ошибка хеширования пароля: %v", err)
		return "", err
	}
	return string(bytes), nil
}

// CheckPassword проверяет соответствие пароля и хеша
func CheckPassword(password, hash string) bool {
	log.Printf("[Auth] Проверка пароля (длина пароля: %d, длина хеша: %d)", len(password), len(hash))

	if len(hash) == 0 {
		log.Printf("[Auth] Ошибка: хеш пароля пустой")
		return false
	}

	if len(password) == 0 {
		log.Printf("[Auth] Ошибка: пароль пустой")
		return false
	}

	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	if err != nil {
		log.Printf("[Auth] Сравнение не удалось: %v", err)
		return false
	}

	log.Printf("[Auth] Пароль успешно проверен")
	return true
}
