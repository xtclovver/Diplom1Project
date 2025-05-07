# Stage 1: Build Backend
FROM golang:1.21-alpine AS builder-backend

WORKDIR /app/backend

# Копируем файлы модулей и загружаем зависимости для кэширования Docker
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# Копируем остальной исходный код бэкенда
COPY backend/ ./

# Собираем бэкенд приложение
# CGO_ENABLED=0 для статической сборки
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o /app/server ./cmd/api

# Копируем конфигурацию бэкенда
COPY backend/configs /app/configs


# Stage 2: Build Frontend
FROM node:18-alpine AS builder-frontend

WORKDIR /app/frontend

# Копируем package.json и package-lock.json для кэширования Docker
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install

# Копируем остальной исходный код фронтенда
COPY frontend/ ./
# Собираем фронтенд
RUN npm run build


# Stage 3: Final image with Nginx
FROM nginx:1.25-alpine

# Устанавливаем gettext для envsubst
RUN apk add --no-cache gettext

# Удаляем стандартную конфигурацию nginx
RUN rm /etc/nginx/conf.d/default.conf

# Создаем директории для бэкенд приложения и его конфигурации
RUN mkdir -p /app/backend/configs

# Копируем собранный бэкенд из этапа builder-backend
COPY --from=builder-backend /app/server /app/backend/server
# Копируем конфигурацию бэкенда из этапа builder-backend
COPY --from=builder-backend /app/configs /app/backend/configs

# Копируем собранные статические файлы фронтенда из этапа builder-frontend
COPY --from=builder-frontend /app/frontend/build /usr/share/nginx/html

# Копируем наш шаблон конфигурации Nginx
COPY nginx.conf.template /etc/nginx/nginx.conf.template

# Копируем скрипт запуска и делаем его исполняемым
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Открываем порт 8080 (порт по умолчанию для Cloud Run, если PORT не задан)
EXPOSE 8080

# Устанавливаем команду для запуска
CMD ["/start.sh"]