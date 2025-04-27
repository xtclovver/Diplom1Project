-- Создание базы данных
CREATE DATABASE IF NOT EXISTS tour_agency;
USE tour_agency;

-- Страны
CREATE TABLE IF NOT EXISTS countries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(3) NOT NULL,
    UNIQUE KEY (code)
);

-- Города
CREATE TABLE IF NOT EXISTS cities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    country_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE
);

-- Отели
CREATE TABLE IF NOT EXISTS hotels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address VARCHAR(255) NOT NULL,
    category SMALLINT NOT NULL, -- Количество звезд
    image_url VARCHAR(255),
    FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
);

-- Номера
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id INT NOT NULL,
    description TEXT,
    beds SMALLINT NOT NULL, -- Количество спальных мест
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

-- Туры
CREATE TABLE IF NOT EXISTS tours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    duration SMALLINT NOT NULL DEFAULT 1, -- Стандартная продолжительность в днях
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
);

-- Доступные даты туров
CREATE TABLE IF NOT EXISTS tour_dates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tour_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    availability INT NOT NULL, -- Количество доступных мест
    price_modifier DECIMAL(5, 2) DEFAULT 1.0, -- Модификатор цены для сезонов
    FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE
);

-- Роли пользователей
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- Пользователи
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL, -- Хешированный пароль bcrypt
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    role_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (username),
    UNIQUE KEY (email),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Заказы
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tour_id INT NOT NULL,
    tour_date_id INT NOT NULL,
    room_id INT,
    people_count SMALLINT NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'paid', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (tour_id) REFERENCES tours(id),
    FOREIGN KEY (tour_date_id) REFERENCES tour_dates(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- Тикеты тех-поддержки
CREATE TABLE IF NOT EXISTS support_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    status ENUM('open', 'in_progress', 'closed') NOT NULL DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Сообщения в тикетах
CREATE TABLE IF NOT EXISTS ticket_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    user_id INT NOT NULL, -- Может быть и пользователь, и сотрудник тех-поддержки
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Добавление данных-заполнителей

-- Роли пользователей
INSERT INTO roles (name) VALUES 
    ('admin'),
    ('user'),
    ('support');

-- Пользователи (пароль: hashed_password - в реальном приложении должен быть хэширован)
INSERT INTO users (username, password, email, full_name, phone, role_id) VALUES 
    ('admin', '$2a$10$5dUVELjS7RMNQdFGTJyI5e4tB63YlhGZCO7LezcLITJfTQU8HOs2W', 'admin@example.com', 'Администратор', '+7 (999) 123-45-67', 1),
    ('user1', '$2a$10$5dUVELjS7RMNQdFGTJyI5e4tB63YlhGZCO7LezcLITJfTQU8HOs2W', 'user1@example.com', 'Иван Иванов', '+7 (999) 765-43-21', 2),
    ('support1', '$2a$10$5dUVELjS7RMNQdFGTJyI5e4tB63YlhGZCO7LezcLITJfTQU8HOs2W', 'support1@example.com', 'Сотрудник Поддержки', '+7 (999) 111-22-33', 3);

-- Страны
INSERT INTO countries (name, code) VALUES 
    ('Россия', 'RU'),
    ('Турция', 'TR'),
    ('Египет', 'EG'),
    ('Таиланд', 'TH'),
    ('ОАЭ', 'AE');

-- Города
INSERT INTO cities (country_id, name) VALUES 
    (1, 'Москва'),
    (1, 'Санкт-Петербург'),
    (1, 'Сочи'),
    (2, 'Анталья'),
    (2, 'Стамбул'),
    (3, 'Хургада'),
    (3, 'Шарм-эль-Шейх'),
    (4, 'Пхукет'),
    (4, 'Бангкок'),
    (5, 'Дубай');

-- Отели
INSERT INTO hotels (city_id, name, description, address, category, image_url) VALUES 
    (3, 'Сочи Марриотт Красная Поляна', 'Роскошный отель с видом на горы', 'Эсто-Садок, ул. Горная 5', 5, '/images/hotels/sochi_marriott.jpg'),
    (3, 'Radisson Blu Resort & Congress', 'Курортный отель рядом с пляжем', 'Адлер, ул. Морская 10', 4, '/images/hotels/radisson_sochi.jpg'),
    (4, 'Турция Делюкс', 'Все включено на побережье', 'Анталья, Пляжная улица 123', 5, '/images/hotels/turkey_deluxe.jpg'),
    (6, 'Red Sea Resort', 'Идеальный вариант для семейного отдыха', 'Хургада, ул. Набережная 45', 4, '/images/hotels/red_sea_resort.jpg'),
    (8, 'Phuket Paradise', 'Бунгало на берегу моря', 'Пхукет, Пляж Патонг 30', 5, '/images/hotels/phuket_paradise.jpg'),
    (10, 'Dubai Luxury Hotel', 'Роскошный отель в центре', 'Дубай, Шейх Зайед Роуд 100', 5, '/images/hotels/dubai_luxury.jpg');

-- Номера
INSERT INTO rooms (hotel_id, description, beds, price, image_url) VALUES 
    (1, 'Стандартный номер с видом на горы', 2, 8000.00, '/images/rooms/sochi_standard.jpg'),
    (1, 'Люкс с балконом', 3, 15000.00, '/images/rooms/sochi_lux.jpg'),
    (2, 'Двухместный номер с видом на море', 2, 7500.00, '/images/rooms/radisson_double.jpg'),
    (3, 'Семейный номер', 4, 6000.00, '/images/rooms/turkey_family.jpg'),
    (4, 'Стандартный номер с видом на море', 2, 5500.00, '/images/rooms/egypt_standard.jpg'),
    (5, 'Бунгало на пляже', 2, 9000.00, '/images/rooms/phuket_bungalow.jpg'),
    (6, 'Премиум с видом на город', 2, 12000.00, '/images/rooms/dubai_premium.jpg');

-- Туры
INSERT INTO tours (city_id, name, description, base_price, image_url, duration, is_active) VALUES 
    (3, 'Горнолыжный отдых в Сочи', 'Зимний отдых на склонах Красной Поляны', 25000.00, '/images/tours/sochi_ski.jpg', 7, true),
    (3, 'Летний отдых в Сочи', 'Пляжный отдых на Черном море', 20000.00, '/images/tours/sochi_beach.jpg', 10, true),
    (4, 'Все включено в Турции', 'Отдых на курортах с системой все включено', 35000.00, '/images/tours/turkey_all_inclusive.jpg', 7, true),
    (6, 'Древний Египет', 'Экскурсионный тур с посещением пирамид', 40000.00, '/images/tours/egypt_ancient.jpg', 8, true),
    (8, 'Райский Таиланд', 'Отдых на лучших пляжах Пхукета', 45000.00, '/images/tours/thailand_paradise.jpg', 12, true),
    (10, 'Роскошный Дубай', 'Шоппинг и достопримечательности Эмиратов', 50000.00, '/images/tours/dubai_luxury_tour.jpg', 5, true);

-- Доступные даты туров
INSERT INTO tour_dates (tour_id, start_date, end_date, availability, price_modifier) VALUES 
    (1, '2023-12-15', '2023-12-22', 20, 1.0),
    (1, '2023-12-25', '2024-01-01', 15, 1.5),
    (2, '2023-06-01', '2023-06-11', 30, 1.0),
    (2, '2023-07-01', '2023-07-11', 25, 1.2),
    (3, '2023-05-10', '2023-05-17', 40, 1.0),
    (3, '2023-08-15', '2023-08-22', 35, 1.1),
    (4, '2023-09-05', '2023-09-13', 25, 1.0),
    (5, '2023-11-01', '2023-11-13', 20, 1.0),
    (6, '2023-10-05', '2023-10-10', 15, 1.0);

-- Заказы
INSERT INTO orders (user_id, tour_id, tour_date_id, room_id, people_count, total_price, status) VALUES 
    (2, 1, 1, 1, 2, 58000.00, 'confirmed'),
    (2, 3, 5, 4, 3, 53000.00, 'paid');

-- Тикеты поддержки
INSERT INTO support_tickets (user_id, subject, status) VALUES 
    (2, 'Вопрос по бронированию', 'open');

-- Сообщения в тикетах
INSERT INTO ticket_messages (ticket_id, user_id, message) VALUES 
    (1, 2, 'Здравствуйте! Я хотел бы уточнить детали моего бронирования.'),
    (1, 3, 'Добрый день! Какие именно детали вас интересуют?'); 