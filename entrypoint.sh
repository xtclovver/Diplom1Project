#!/bin/sh

# Настройка переменных окружения для бэкенда
export PORT=${PORT:-8081}
export GIN_MODE=${GIN_MODE:-release}

# Проверяем наличие файла конфигурации
if [ ! -f "/app/configs/config.json" ]; then
    echo "Ошибка: Файл конфигурации не найден!"
    exit 1
fi

# Убедимся, что каталог для логов Nginx существует
mkdir -p /var/log/nginx

# Стартуем бэкенд на порту 8081
echo "Запуск бэкенда на порту 8081..."
cd /app
/app/api &
BACKEND_PID=$!

echo "Проверка готовности бэкенда..."
# Даем бэкенду время на запуск
sleep 5

# Проверяем, запустился ли бэкенд
if ! ps -p $BACKEND_PID > /dev/null; then
    echo "Ошибка: Бэкенд не запустился!"
    exit 1
fi

echo "Запуск Nginx на порту 8080..."
# Сначала проверяем конфигурацию Nginx
nginx -t

# Запускаем Nginx в фоновом режиме
nginx -g 'daemon off;' 