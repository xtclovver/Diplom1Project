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
    first_name VARCHAR(100),
    last_name VARCHAR(155),
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

-- Пользователи (пароль: password)
INSERT INTO users (username, password, email, first_name, last_name, full_name, phone, role_id) VALUES 
    ('admin', '$2a$10$VnSofjaTgaF8SwigfzYseuxTDmD0MCXOE3qn70NrNnlAt2Zgk3J8a', 'admin@example.com', 'Администратор', '', 'Администратор', '+7 (999) 123-45-67', 1),
    ('user1', '$2a$10$VnSofjaTgaF8SwigfzYseuxTDmD0MCXOE3qn70NrNnlAt2Zgk3J8a', 'user1@example.com', 'Иван', 'Иванов', 'Иван Иванов', '+7 (999) 765-43-21', 2),
    ('support1', '$2a$10$VnSofjaTgaF8SwigfzYseuxTDmD0MCXOE3qn70NrNnlAt2Zgk3J8a', 'support1@example.com', 'Сотрудник', 'Поддержки', 'Сотрудник Поддержки', '+7 (999) 111-22-33', 3);

-- Страны
INSERT INTO countries (name, code) VALUES 
    ('Россия', 'RU'),
    ('Турция', 'TR'),
    ('Египет', 'EG'),
    ('Таиланд', 'TH'),
    ('ОАЭ', 'AE'),
    ('Италия', 'IT'),
    ('Испания', 'ES'),
    ('Индонезия', 'ID'),
    ('Греция', 'GR'),
    ('Япония', 'JP'),
    ('Вьетнам', 'VN'),
    ('Мексика', 'MX'),
    ('Грузия', 'GE'),
    ('Мальдивы', 'MV'),
    ('Франция', 'FR');

-- Города
INSERT INTO cities (country_id, name) VALUES 
    (1, 'Москва'),
    (1, 'Санкт-Петербург'),
    (1, 'Сочи'),
    (1, 'Казань'),
    (1, 'Калининград'),
    (2, 'Анталья'),
    (2, 'Стамбул'),
    (2, 'Бодрум'),
    (3, 'Хургада'),
    (3, 'Шарм-эль-Шейх'),
    (4, 'Пхукет'),
    (4, 'Бангкок'),
    (4, 'Паттайя'),
    (5, 'Дубай'),
    (5, 'Абу-Даби'),
    (6, 'Рим'),
    (6, 'Венеция'),
    (6, 'Флоренция'),
    (7, 'Барселона'),
    (7, 'Мадрид'),
    (8, 'Бали'),
    (9, 'Афины'),
    (9, 'Санторини'),
    (10, 'Токио'),
    (10, 'Киото'),
    (11, 'Нячанг'),
    (11, 'Хошимин'),
    (12, 'Канкун'),
    (12, 'Мехико'),
    (13, 'Тбилиси'),
    (13, 'Батуми'),
    (14, 'Мале'),
    (15, 'Париж'),
    (15, 'Ницца');

-- Отели
INSERT INTO hotels (city_id, name, description, address, category, image_url) VALUES 
    (3, 'Сочи Марриотт Красная Поляна', 'Роскошный отель с видом на горы', 'Эсто-Садок, ул. Горная 5', 5, '/images/hotels/sochi_marriott.jpg'),
    (3, 'Radisson Blu Resort & Congress', 'Курортный отель рядом с пляжем', 'Адлер, ул. Морская 10', 4, '/images/hotels/radisson_sochi.jpg'),
    (6, 'Antalya Luxury Resort', 'Все включено на побережье Средиземного моря', 'Анталья, Пляжная улица 123', 5, '/images/hotels/turkey_deluxe.jpg'),
    (7, 'Istanbul Grand Hotel', 'В историческом центре Стамбула', 'Стамбул, ул. Султанахмет 15', 4, '/images/hotels/istanbul_grand.jpg'),
    (9, 'Red Sea Resort', 'Идеальный вариант для семейного отдыха', 'Хургада, ул. Набережная 45', 4, '/images/hotels/red_sea_resort.jpg'),
    (10, 'Sharm Premium Spa', 'Отель премиум-класса с собственным пляжем', 'Шарм-эль-Шейх, Наама Бей 28', 5, '/images/hotels/sharm_premium.jpg'),
    (11, 'Phuket Paradise', 'Бунгало на берегу моря', 'Пхукет, Пляж Патонг 30', 5, '/images/hotels/phuket_paradise.jpg'),
    (13, 'Pattaya Beach Resort', 'Отель в центре Паттайи', 'Паттайя, Бич Роуд 55', 4, '/images/hotels/pattaya_beach.jpg'),
    (14, 'Dubai Luxury Hotel', 'Роскошный отель в центре', 'Дубай, Шейх Зайед Роуд 100', 5, '/images/hotels/dubai_luxury.jpg'),
    (16, 'Roma Imperiale', 'Отель в самом сердце Рима', 'Рим, Виа дель Корсо 45', 4, '/images/hotels/roma_imperiale.jpg'),
    (19, 'Barcelona Sea View', 'С видом на Средиземное море', 'Барселона, Пасео Маритимо 28', 4, '/images/hotels/barcelona_sea.jpg'),
    (21, 'Bali Ocean Resort', 'Тропический рай на Бали', 'Бали, Кута Бич 15', 5, '/images/hotels/bali_ocean.jpg'),
    (23, 'Santorini Blue', 'Традиционный отель на утесе', 'Санторини, Ойя 22', 4, '/images/hotels/santorini_blue.jpg'),
    (24, 'Tokyo Skyline Hotel', 'Современный отель с видом на город', 'Токио, Синдзюку 78', 5, '/images/hotels/tokyo_skyline.jpg'),
    (26, 'Nha Trang Palms Resort', 'Тропический отель у океана', 'Нячанг, пр. Бич 112', 4, '/images/hotels/nhatrang_palms.jpg'),
    (28, 'Cancun Paradise Resort', 'Все включено на берегу Карибского моря', 'Канкун, Зона Отелей 45', 5, '/images/hotels/cancun_paradise.jpg'),
    (30, 'Old Tbilisi Hotel', 'Уютный отель в историческом центре', 'Тбилиси, ул. Руставели 27', 4, '/images/hotels/tbilisi_old.jpg'),
    (31, 'Batumi Sea View', 'Современный отель с видом на Черное море', 'Батуми, пр. Приморский 55', 4, '/images/hotels/batumi_sea.jpg'),
    (32, 'Maldives Water Villa', 'Виллы на воде с прямым доступом к океану', 'Южный Мале атолл', 5, '/images/hotels/maldives_villa.jpg'),
    (33, 'Paris Louvre Palace', 'Элегантный отель в сердце Парижа', 'Париж, ул. Риволи 14', 5, '/images/hotels/paris_louvre.jpg');

-- Номера
INSERT INTO rooms (hotel_id, description, beds, price, image_url) VALUES 
    (1, 'Стандартный номер с видом на горы', 2, 8000.00, '/images/rooms/sochi_standard.jpg'),
    (1, 'Люкс с балконом', 3, 15000.00, '/images/rooms/sochi_lux.jpg'),
    (2, 'Двухместный номер с видом на море', 2, 7500.00, '/images/rooms/radisson_double.jpg'),
    (3, 'Семейный номер с всё включено', 4, 12000.00, '/images/rooms/turkey_family.jpg'),
    (3, 'Люкс с видом на море', 2, 18000.00, '/images/rooms/turkey_lux.jpg'),
    (4, 'Стандартный номер в центре Стамбула', 2, 9000.00, '/images/rooms/istanbul_standard.jpg'),
    (5, 'Стандартный номер с видом на море', 2, 6500.00, '/images/rooms/egypt_standard.jpg'),
    (6, 'Премиум номер с джакузи', 2, 14000.00, '/images/rooms/sharm_premium.jpg'),
    (7, 'Бунгало на пляже', 2, 9000.00, '/images/rooms/phuket_bungalow.jpg'),
    (8, 'Стандартный номер в Паттайе', 2, 5000.00, '/images/rooms/pattaya_standard.jpg'),
    (9, 'Премиум с видом на город', 2, 18000.00, '/images/rooms/dubai_premium.jpg'),
    (10, 'Классический номер в Риме', 2, 12000.00, '/images/rooms/rome_classic.jpg'),
    (11, 'Номер с видом на море', 2, 13000.00, '/images/rooms/barcelona_sea.jpg'),
    (12, 'Вилла с бассейном', 4, 25000.00, '/images/rooms/bali_villa.jpg'),
    (13, 'Номер с видом на кальдеру', 2, 16000.00, '/images/rooms/santorini_view.jpg'),
    (14, 'Современный номер в Токио', 2, 15000.00, '/images/rooms/tokyo_modern.jpg'),
    (15, 'Делюкс с видом на океан', 2, 7500.00, '/images/rooms/nhatrang_deluxe.jpg'),
    (16, 'Семейный люкс с видом на океан', 4, 19000.00, '/images/rooms/cancun_family.jpg'),
    (17, 'Традиционный грузинский номер', 2, 5500.00, '/images/rooms/tbilisi_traditional.jpg'),
    (18, 'Панорамный номер с видом на море', 2, 8500.00, '/images/rooms/batumi_panorama.jpg'),
    (19, 'Водная вилла с джакузи', 2, 45000.00, '/images/rooms/maldives_water.jpg'),
    (20, 'Номер с видом на Эйфелеву башню', 2, 22000.00, '/images/rooms/paris_eiffel.jpg');

-- Туры
INSERT INTO tours (city_id, name, description, base_price, image_url, duration, is_active) VALUES 
    (3, 'Горнолыжный отдых в Сочи', 'Зимний отдых на склонах Красной Поляны. Катание на лыжах и сноубордах, СПА-процедуры после активного дня и вечерние развлечения в ресторанах и барах курорта.', 45000.00, '/images/tours/sochi_ski.jpg', 7, true),
    (3, 'Летний отдых в Сочи', 'Пляжный отдых на Черном море. Плавание в теплой морской воде, экскурсии по олимпийским объектам, посещение дендрария и парка развлечений.', 35000.00, '/images/tours/sochi_beach.jpg', 10, true),
    (6, 'Все включено в Турции', 'Отдых на курортах Анталии с системой все включено. Проживание в роскошном отеле на первой линии, питание в ресторанах отеля, развлечения и анимация.', 55000.00, '/images/tours/turkey_all_inclusive.jpg', 7, true),
    (7, 'Исторический Стамбул', 'Экскурсионный тур по историческим местам Стамбула. Посещение Голубой мечети, дворца Топкапы, Гранд Базара и круиз по Босфору.', 45000.00, '/images/tours/istanbul_historic.jpg', 5, true),
    (9, 'Древний Египет', 'Экскурсионный тур с посещением древних пирамид, Сфинкса, храмов Луксора и Карнакского храма. Комбинированный с пляжным отдыхом на Красном море.', 60000.00, '/images/tours/egypt_ancient.jpg', 8, true),
    (10, 'Отдых в Шарм-эль-Шейхе', 'Пляжный отдых в одном из лучших курортов Египта. Снорклинг и дайвинг на коралловых рифах, сафари в пустыне и вечерние развлечения.', 50000.00, '/images/tours/sharm_beach.jpg', 9, true),
    (11, 'Райский Таиланд', 'Отдых на лучших пляжах Пхукета. Экскурсии на острова Пхи-Пхи, поездка в тропический лес, посещение этнической деревни и храмов.', 85000.00, '/images/tours/thailand_paradise.jpg', 12, true),
    (13, 'Паттайя - город развлечений', 'Активный отдых в Паттайе. Водные виды спорта, посещение шоу трансвеститов, парков развлечений и тропического сада Нонг Нуч.', 75000.00, '/images/tours/pattaya_fun.jpg', 10, true),
    (14, 'Роскошный Дубай', 'Шоппинг и достопримечательности Эмиратов. Посещение Бурдж-Халифа, шоппинг в Dubai Mall, сафари в пустыне и круиз по бухте Дубая.', 90000.00, '/images/tours/dubai_luxury_tour.jpg', 5, true),
    (16, 'Вечный город Рим', 'Экскурсионный тур по Риму с посещением Колизея, Форума, Ватикана, фонтана Треви и других исторических мест.', 90000.00, '/images/tours/rome_eternal.jpg', 7, true),
    (19, 'Солнечная Барселона', 'Знакомство с творениями Гауди, прогулки по Рамбле, посещение Готического квартала и отдых на пляжах Барселоны.', 80000.00, '/images/tours/barcelona_sun.jpg', 6, true),
    (21, 'Экзотический Бали', 'Отдых на лучших пляжах Бали, посещение храмов, рисовых террас, вулкана Батур и обезьяньего леса.', 120000.00, '/images/tours/bali_exotic.jpg', 14, true),
    (23, 'Романтика Санторини', 'Отдых на вулканическом острове с белоснежными домиками и голубыми куполами церквей. Посещение древних руин, виноделен и купание в Эгейском море.', 110000.00, '/images/tours/santorini_romance.jpg', 8, true),
    (24, 'Технологичный Токио', 'Экскурсии по современному Токио, посещение Акихабары, храма Сенсо-дзи, императорского дворца и смотровой площадки Tokyo Skytree.', 130000.00, '/images/tours/tokyo_tech.jpg', 9, true),
    (26, 'Тропический Вьетнам', 'Пляжный отдых в Нячанге с экскурсиями на острова, грязевые ванны и дегустацией местной кухни', 65000.00, '/images/tours/vietnam_tropical.jpg', 12, true),
    (28, 'Карибское побережье Мексики', 'Отдых на белоснежных пляжах Канкуна, посещение древних городов майя и заповедников', 115000.00, '/images/tours/mexico_caribean.jpg', 10, true),
    (30, 'Гостеприимная Грузия', 'Культурный тур с посещением Тбилиси, Мцхеты и дегустацией вин в Кахетии', 42000.00, '/images/tours/georgia_wine.jpg', 8, true),
    (31, 'Черное море в Батуми', 'Пляжный отдых и экскурсии по Батуми и окрестностям, знаменитая набережная и ботанический сад', 38000.00, '/images/tours/batumi_relax.jpg', 7, true),
    (32, 'Мальдивский рай', 'Отдых на роскошном курорте на частном острове, снорклинг в лазурных водах, SPA-процедуры', 180000.00, '/images/tours/maldives_paradise.jpg', 10, true),
    (33, 'Романтичный Париж', 'Классический тур по столице Франции с посещением Лувра, Монмартра, Эйфелевой башни и круизом по Сене', 95000.00, '/images/tours/paris_romantic.jpg', 6, true);

-- Доступные даты туров
INSERT INTO tour_dates (tour_id, start_date, end_date, availability, price_modifier) VALUES 
    (1, '2024-01-15', '2024-01-22', 20, 1.0),
    (1, '2024-01-25', '2024-02-01', 15, 1.5),
    (1, '2024-02-10', '2024-02-17', 10, 1.2),
    (2, '2024-06-01', '2024-06-11', 30, 1.0),
    (2, '2024-07-01', '2024-07-11', 25, 1.2),
    (2, '2024-08-05', '2024-08-15', 20, 1.3),
    (3, '2024-05-10', '2024-05-17', 40, 1.0),
    (3, '2024-06-15', '2024-06-22', 35, 1.1),
    (3, '2024-07-20', '2024-07-27', 30, 1.2),
    (4, '2024-04-05', '2024-04-10', 25, 1.0),
    (4, '2024-05-15', '2024-05-20', 20, 1.1),
    (5, '2024-09-05', '2024-09-13', 25, 1.0),
    (5, '2024-10-10', '2024-10-18', 20, 0.9),
    (6, '2024-06-01', '2024-06-10', 30, 1.0),
    (6, '2024-07-15', '2024-07-24', 25, 1.1),
    (7, '2024-11-01', '2024-11-13', 20, 1.0),
    (7, '2024-12-05', '2024-12-17', 15, 1.2),
    (8, '2024-03-10', '2024-03-20', 30, 0.9),
    (8, '2024-04-15', '2024-04-25', 25, 1.0),
    (9, '2024-09-05', '2024-09-10', 15, 1.0),
    (9, '2024-10-15', '2024-10-20', 10, 1.1),
    (10, '2024-05-01', '2024-05-08', 20, 1.0),
    (10, '2024-06-10', '2024-06-17', 15, 1.1),
    (11, '2024-07-05', '2024-07-11', 25, 1.0),
    (11, '2024-08-20', '2024-08-26', 20, 1.1),
    (12, '2024-06-01', '2024-06-15', 15, 1.0),
    (12, '2024-07-10', '2024-07-24', 10, 1.2),
    (13, '2024-05-15', '2024-05-23', 20, 1.0),
    (13, '2024-06-20', '2024-06-28', 15, 1.1),
    (14, '2024-04-10', '2024-04-19', 20, 1.0),
    (14, '2024-05-20', '2024-05-29', 15, 1.1),
    (15, '2024-05-05', '2024-05-17', 25, 1.0),
    (15, '2024-06-15', '2024-06-27', 20, 1.1),
    (16, '2024-07-10', '2024-07-20', 20, 1.0),
    (16, '2024-08-15', '2024-08-25', 15, 1.2),
    (17, '2024-04-10', '2024-04-18', 30, 0.9),
    (17, '2024-05-15', '2024-05-23', 25, 1.0),
    (18, '2024-06-05', '2024-06-12', 25, 1.0),
    (18, '2024-08-10', '2024-08-17', 20, 1.1),
    (19, '2024-09-15', '2024-09-25', 15, 1.0),
    (19, '2024-10-20', '2024-10-30', 10, 0.9),
    (20, '2024-04-10', '2024-04-16', 25, 1.0),
    (20, '2024-05-15', '2024-05-21', 20, 1.1);

-- Заказы
INSERT INTO orders (user_id, tour_id, tour_date_id, room_id, people_count, total_price, status) VALUES 
    (2, 1, 1, 1, 2, 98000.00, 'confirmed'),
    (2, 3, 7, 4, 3, 165000.00, 'paid');

-- Тикеты поддержки
INSERT INTO support_tickets (user_id, subject, status) VALUES 
    (2, 'Вопрос по бронированию', 'open');

-- Сообщения в тикетах
INSERT INTO ticket_messages (ticket_id, user_id, message) VALUES 
    (1, 2, 'Здравствуйте! Я хотел бы уточнить детали моего бронирования.'),
    (1, 3, 'Добрый день! Какие именно детали вас интересуют?'); 