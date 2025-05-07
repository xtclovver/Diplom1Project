#!/bin/sh
set -e

# Настройка переменных окружения
export BACKEND_PORT=8080
export GIN_MODE=release

# Cloud Run использует порт из переменной PORT
export NGINX_PORT=${PORT:-8081}
echo "Настройка портов: Nginx будет работать на порту ${NGINX_PORT}, бэкенд на порту ${BACKEND_PORT}"

# Показываем информацию о сети для отладки
echo "==== Сетевая информация ===="
ip addr show
echo "=========================="

# Обновляем конфигурацию Nginx - порт слушателя
sed -i "s/listen 8080/listen ${NGINX_PORT}/g" /etc/nginx/nginx.conf

# Обновляем порт бэкенда в Nginx - правильный путь к директиве в контексте server
sed -i "s/set \$backend_port \"[0-9]*\"/set \$backend_port \"${BACKEND_PORT}\"/g" /etc/nginx/nginx.conf

# Настраиваем порт в конфигурации бэкенда
if [ -f "/app/configs/config.json" ]; then
    TMP_CONFIG=$(mktemp)
    cat /app/configs/config.json | sed 's/"port": "[0-9]*"/"port": "'${BACKEND_PORT}'"/g' > ${TMP_CONFIG}
    mv ${TMP_CONFIG} /app/configs/config.json
    echo "Порт бэкенда настроен: ${BACKEND_PORT}"
    echo "Содержимое конфигурации бэкенда:"
    cat /app/configs/config.json
else
    echo "Предупреждение: Конфигурация бэкенда не найдена, используем значения по умолчанию"
fi

# Запускаем бэкенд
echo "Запуск бэкенда..."
cd /app
/app/api &
BACKEND_PID=$!

# Пауза для запуска бэкенда
echo "Ожидание запуска бэкенда..."
sleep 5

# Проверяем, запустился ли бэкенд
if ! ps | grep "/app/api" | grep -v grep > /dev/null; then
    echo "ОШИБКА: Бэкенд не запустился!"
    echo "Активные процессы:"
    ps
    exit 1
fi

# Проверяем, слушает ли бэкенд порт
echo "Проверка слушающих портов:"
netstat -tulpn || echo "Команда netstat недоступна"

# Проверка доступности бэкенда
echo "Проверка доступности бэкенда:"
curl -v http://127.0.0.1:${BACKEND_PORT}/api/countries || echo "Бэкенд не отвечает на запрос /api/countries"

# Проверка конфигурации Nginx перед запуском
echo "Проверка конфигурации Nginx..."
nginx -t

# Запускаем Nginx в фоновом режиме
echo "Запуск Nginx..."
nginx -g 'daemon off;' &
NGINX_PID=$!

# Даём немного времени на запуск Nginx
sleep 2

# Проверяем доступность через Nginx
echo "Проверка доступности через Nginx:"
curl -v http://127.0.0.1:${NGINX_PORT}/api/countries || echo "Nginx не проксирует запрос к бэкенду"

# Ожидаем завершения Nginx
wait $NGINX_PID 