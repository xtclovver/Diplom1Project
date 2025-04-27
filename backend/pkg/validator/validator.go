package validator

import (
	"fmt"
	"net/mail"
	"strings"
)

// Validate структура для хранения ошибок валидации
type Validate struct {
	errors map[string]string
}

// New создает новый экземпляр Validate
func New() *Validate {
	return &Validate{errors: make(map[string]string)}
}

// Valid возвращает true, если ошибок нет
func (v *Validate) Valid() bool {
	return len(v.errors) == 0
}

// AddError добавляет сообщение об ошибке для заданного поля
func (v *Validate) AddError(key, message string) {
	if _, exists := v.errors[key]; !exists {
		v.errors[key] = message
	}
}

// Check добавляет сообщение об ошибке только если ok равно false
func (v *Validate) Check(ok bool, key, message string) {
	if !ok {
		v.AddError(key, message)
	}
}

// FirstError возвращает первую попавшуюся ошибку (для упрощения)
func (v *Validate) FirstError() error {
	for _, msg := range v.errors {
		return fmt.Errorf(msg) // Возвращаем просто текст ошибки
	}
	return nil
}

// AssertNotEmpty проверяет, что строка не пустая
func (v *Validate) AssertNotEmpty(value string, key string) bool {
	ok := strings.TrimSpace(value) != ""
	v.Check(ok, key, fmt.Sprintf("%s must be provided", key))
	return ok
}

// AssertPositive проверяет, что число больше нуля
func (v *Validate) AssertPositive(value float64, key string) bool {
	ok := value > 0
	v.Check(ok, key, fmt.Sprintf("%s must be positive", key))
	return ok
}

// AssertRange проверяет, что число находится в диапазоне [min, max]
func (v *Validate) AssertRange(value float64, min, max float64, key string) bool {
	ok := value >= min && value <= max
	v.Check(ok, key, fmt.Sprintf("%s must be between %.2f and %.2f", key, min, max))
	return ok
}

// AssertEmail проверяет, что строка является валидным email адресом
func (v *Validate) AssertEmail(value string, key string) bool {
	_, err := mail.ParseAddress(value)
	ok := err == nil
	v.Check(ok, key, fmt.Sprintf("%s must be a valid email address", key))
	return ok
}
