#!/bin/sh
set -e

# Настройка переменных окружения
export BACKEND_PORT=8081
export GIN_MODE=release

# Cloud Run использует порт из переменной PORT
export NGINX_PORT=${PORT:-8080}
echo "Настройка портов: Nginx будет работать на порту ${NGINX_PORT}, бэкенд на порту ${BACKEND_PORT}"

# Обновляем конфигурацию Nginx
sed -i "s/listen 8080/listen ${NGINX_PORT}/g" /etc/nginx/nginx.conf
sed -i "s/set \$backend_port \"[0-9]*\"/set \$backend_port \"${BACKEND_PORT}\"/g" /etc/nginx/nginx.conf

# Настраиваем порт в конфигурации бэкенда
if [ -f "/app/configs/config.json" ]; then
    TMP_CONFIG=$(mktemp)
    cat /app/configs/config.json | sed 's/"port": "[0-9]*"/"port": "'${BACKEND_PORT}'"/g' > ${TMP_CONFIG}
    mv ${TMP_CONFIG} /app/configs/config.json
    echo "Порт бэкенда настроен: ${BACKEND_PORT}"
else
    echo "Предупреждение: Конфигурация бэкенда не найдена, используем значения по умолчанию"
fi

# Запускаем бэкенд
echo "Запуск бэкенда..."
cd /app
/app/api &

# Пауза для запуска бэкенда
echo "Ожидание запуска бэкенда..."
sleep 3

# Запускаем Nginx в фоновом режиме
echo "Запуск Nginx..."
exec nginx -g 'daemon off;' 