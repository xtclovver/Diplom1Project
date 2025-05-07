#!/bin/sh

# Устанавливаем порт для Nginx из переменной окружения PORT,
# или используем 8080, если PORT не задана.
export NGINX_PORT=${PORT:-8080}

# Подставляем значение порта в шаблон конфигурации Nginx
# и сохраняем результат в /etc/nginx/nginx.conf
envsubst '\$NGINX_PORT' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Выводим итоговую конфигурацию Nginx для отладки (опционально)
echo "--- Используемая конфигурация Nginx ---"
cat /etc/nginx/nginx.conf
echo "------------------------------------"

# Переходим в директорию бэкенда и запускаем его в фоновом режиме
cd /app/backend
./server &

# Запускаем nginx в основном режиме (foreground)
nginx -g 'daemon off;'