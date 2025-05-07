# ---- Stage 1: Build Backend ----
FROM golang:1.21-alpine AS backend-builder

WORKDIR /app/backend

# Копируем Go модули и скачиваем зависимости
# Это использует кэш Docker
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# Копируем остальной исходный код бэкенда
COPY backend/ ./

# Собираем бэкенд
# Основной пакет находится в cmd/api
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/api ./cmd/api/main.go

# ---- Stage 2: Build Frontend ----
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Копируем package.json и package-lock.json
COPY frontend/package.json frontend/package-lock.json ./

# Устанавливаем зависимости (включая devDependencies, нужные для сборки)
RUN npm ci

# Делаем скрипты в node_modules/.bin исполняемыми
RUN chmod -R +x node_modules/.bin

# Копируем остальной исходный код фронтенда
COPY frontend/ ./

# Создаем .env файл для настройки API_URL для продакшн сборки
# Используем относительный путь к API вместо абсолютного
RUN echo "REACT_APP_API_URL=/api" > .env

# Собираем фронтенд
RUN npm run build

# ---- Stage 3: Final Image ----
FROM nginx:1.25-alpine

# Устанавливаем gettext для envsubst в entrypoint.sh
RUN apk add --no-cache gettext

# Копируем собранный бэкенд из этапа backend-builder
COPY --from=backend-builder /app/api /app/api

# Копируем собранные статические файлы фронтенда из этапа frontend-builder
COPY --from=frontend-builder /app/frontend/build /usr/share/nginx/html

# Копируем конфигурацию Nginx и конфигурацию бэкенда
COPY nginx.conf /etc/nginx/nginx.conf
COPY backend/configs/config.json /app/configs/config.json

# Копируем entrypoint скрипт
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Экспонируем порт 8080 (стандартный порт для многих облачных сервисов)
EXPOSE 8080

# Устанавливаем entrypoint скрипт в качестве команды запуска
ENTRYPOINT ["/entrypoint.sh"] 