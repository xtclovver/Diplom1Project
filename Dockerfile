# Stage 1: Build Backend
FROM golang:1.21-alpine AS builder-backend

WORKDIR /app/backend

# Копируем файлы модулей и загружаем зависимости для кэширования Docker
COPY backend/go.mod backend/go.sum ./
RUN go mod download && go mod verify # Добавил verify

# Копируем остальной исходный код бэкенда
COPY backend/ ./

# Собираем бэкенд приложение
# CGO_ENABLED=0 для статической сборки
# Используем ваш путь ./cmd/api
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o /app/server ./cmd/api

# Копируем существующую конфигурацию бэкенда
COPY backend/configs/config.json /app/backend_configs/config.json


# Stage 2: Build Frontend
FROM node:18-alpine AS builder-frontend

WORKDIR /app/frontend

# Копируем package.json и package-lock.json для кэширования Docker
COPY frontend/package.json frontend/package-lock.json* ./
# Копируем tsconfig.json, если используется TypeScript для сборки
COPY frontend/tsconfig.json ./

RUN npm install

# Копируем остальной исходный код фронтенда
COPY frontend/ ./

# Переменная окружения для URL API бэкенда
# Это значение будет встроено в статические файлы фронтенда во время сборки.
# Оно указывает, что API доступно на localhost:BACKEND_PORT ВНУТРИ контейнера.
# BACKEND_PORT будет определен позже, например, 8081
ARG REACT_APP_API_URL_ARG="http://localhost:8081" # Убедитесь, что порт совпадает с тем, на котором будет слушать бэкенд
ENV REACT_APP_API_URL=$REACT_APP_API_URL_ARG

# Собираем фронтенд
RUN npm run build


# Stage 3: Final image (без Nginx)
FROM node:18-alpine # Используем Node.js образ, чтобы иметь npm/npx для 'serve'

# Устанавливаем gettext для envsubst и ca-certificates
# gettext может быть не нужен, если config.json статический, но оставим для общности или удалим, если точно не нужен.
RUN apk add --no-cache gettext ca-certificates

WORKDIR /app

# Создаем директории для бэкенд приложения и его конфигурации
RUN mkdir -p /app/backend/configs

# Копируем собранный бэкенд из этапа builder-backend
COPY --from=builder-backend /app/server /app/backend/server
# Копируем конфигурацию бэкенда из этапа builder-backend
COPY --from=builder-backend /app/backend_configs/config.json /app/backend/configs/config.json

# Копируем собранные статические файлы фронтенда из этапа builder-frontend
RUN mkdir -p /app/frontend_static
COPY --from=builder-frontend /app/frontend/build /app/frontend_static

# Копируем новый скрипт запуска и делаем его исполняемым
COPY start_services.sh /start_services.sh
RUN chmod +x /start_services.sh

# Порт, на котором будет слушать frontend-сервер (serve)
# Этот порт будет доступен снаружи контейнера
EXPOSE 3000

# Переменные окружения для конфигурации (могут быть переопределены при запуске)
ENV DB_HOST=db_host_placeholder
ENV DB_USER=db_user_placeholder
ENV DB_PASSWORD=db_password_placeholder
ENV DB_NAME=db_name_placeholder
ENV DB_PORT_NUMBER=3306
ENV BACKEND_INTERNAL_PORT=8081 # Порт, на котором Go-приложение будет слушать внутри контейнера
ENV FRONTEND_PORT=3000        # Порт, на котором 'serve' будет слушать

# Устанавливаем команду для запуска
CMD ["/start_services.sh"]