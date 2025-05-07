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

# Убедимся, что необходимые переменные окружения для БД экспортированы и установим значения по умолчанию, если нужно
export DB_HOST=${DB_HOST}                 # Должна быть предоставлена в среде Cloud Run
export DB_USER=${DB_USER}                 # Должна быть предоставлена в среде Cloud Run
export DB_PASSWORD=${DB_PASSWORD}         # Должна быть предоставлена в среде Cloud Run
export DB_NAME=${DB_NAME}                 # Должна быть предоставлена в среде Cloud Run
export DB_PORT=${DB_PORT:-3306}           # По умолчанию 3306 для MySQL, если не задано

# Определяем список переменных для envsubst, чтобы избежать подстановки непреднамеренных переменных
# Убедитесь, что они соответствуют плейсхолдерам в вашем config.json.template
VARIABLES_TO_SUBSTITUTE='${DB_HOST} ${DB_USER} ${DB_PASSWORD} ${DB_NAME} ${DB_PORT}'

echo "--- Подстановка переменных окружения в конфигурацию бэкенда ---"
CONFIG_TEMPLATE_PATH="/app/backend/configs/config.json.template"
CONFIG_OUTPUT_PATH="/app/backend/configs/config.json"

if [ ! -f "$CONFIG_TEMPLATE_PATH" ]; then
    echo "ОШИБКА: Шаблон конфигурации бэкенда $CONFIG_TEMPLATE_PATH не найден!"
    # В зависимости от критичности, можно завершить работу:
    # exit 1
else
    echo "Генерация $CONFIG_OUTPUT_PATH из $CONFIG_TEMPLATE_PATH..."
    # Используем кавычки вокруг VARIABLES_TO_SUBSTITUTE, чтобы envsubst правильно обработал список
    envsubst "$VARIABLES_TO_SUBSTITUTE" < "$CONFIG_TEMPLATE_PATH" > "$CONFIG_OUTPUT_PATH"
    
    echo "Итоговая конфигурация бэкенда ($CONFIG_OUTPUT_PATH):"
    cat "$CONFIG_OUTPUT_PATH"
fi
echo "-------------------------------------------------------------"

# Переходим в директорию бэкенда и запускаем его в фоновом режиме
cd /app/backend
./server &

# Запускаем nginx в основном режиме (foreground)
nginx -g 'daemon off;'