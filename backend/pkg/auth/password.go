package auth

import (
	"golang.org/x/crypto/bcrypt"
)

// Стоимость хеширования bcrypt (больше = безопаснее, но медленнее)
const bcryptCost = 12

// HashPassword хеширует пароль используя bcrypt
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcryptCost)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

// CheckPassword проверяет соответствие пароля и хеша
func CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
