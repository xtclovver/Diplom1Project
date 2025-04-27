package service

import "errors"

// ErrInvalidCredentials ошибка неверных учетных данных
var ErrInvalidCredentials = errors.New("invalid credentials")

// TODO: Добавить другие специфичные ошибки сервиса
// например, ErrNotFound, ErrValidation, ErrForbidden и т.д.
