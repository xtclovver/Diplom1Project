#!/bin/sh

# Выход при ошибке
set -e

# Устанавливаем значения по умолчанию, если переменные окружения не заданы
export DB_HOST=${DB_HOST}
export DB_USER=${DB_USER}
export DB_PASSWORD=${DB_PASSWORD}
export DB_NAME=${DB_NAME}
export DB_PORT_NUMBER=${DB_PORT_NUMBER:-3306}
export BACKEND_INTERNAL_PORT=${BACKEND_INTERNAL_PORT:-8081} # Порт для Go-приложения
export FRONTEND_PORT=${PORT:-8080}             # Порт для 'serve', берется из PORT (Cloud Run) или по умолчанию 8080
echo "Используется статический файл конфигурации backend: /app/backend/configs/config.json"
echo "Содержимое:"
cat /app/backend/configs/config.json
echo "------------------------------------"

# --- Запуск Backend ---
echo "Запуск backend-сервера на порту ${BACKEND_INTERNAL_PORT}..."
cd /app/backend
./server &
BACKEND_PID=$!
cd /app # Возвращаемся в рабочую директорию

# Даем бэкенду немного времени на запуск (опционально)
sleep 2

# --- Запуск Frontend ---
echo "Запуск frontend-сервера (serve) на порту ${FRONTEND_PORT} для директории /app/frontend_static..."
# -s: для SPA (Single Page Application), перенаправляет все запросы на index.html
# -l: слушать на указанном порту и хосте (0.0.0.0 для доступности извне контейнера)
npx serve -s /app/frontend_static -l tcp://0.0.0.0:${FRONTEND_PORT} &
FRONTEND_PID=$!

# Функция для корректного завершения процессов
cleanup() {
    echo "Получен сигнал завершения. Остановка сервисов..."
    kill -TERM $BACKEND_PID 2>/dev/null
    kill -TERM $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID 2>/dev/null
    wait $FRONTEND_PID 2>/dev/null
    echo "Сервисы остановлены."
    exit 0
}

# Перехватываем сигналы для корректного завершения
trap cleanup SIGINT SIGTERM

echo "Backend (PID: $BACKEND_PID) и Frontend (PID: $FRONTEND_PID) запущены."
echo "Frontend доступен на порту ${FRONTEND_PORT}."

# Ожидаем завершения любого из фоновых процессов
# Если один из них упадет, скрипт завершится, и контейнер остановится.
wait -n $BACKEND_PID $FRONTEND_PID
EXIT_CODE=$?
echo "Один из процессов завершился с кодом $EXIT_CODE. Завершение работы..."

# Принудительно останавливаем оставшийся процесс, если он еще работает
kill -KILL $BACKEND_PID 2>/dev/null || true
kill -KILL $FRONTEND_PID 2>/dev/null || true

exit $EXIT_CODE