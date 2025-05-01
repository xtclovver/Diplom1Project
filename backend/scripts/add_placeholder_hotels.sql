-- Скрипт для добавления двух отелей-заполнителей в каждый город, где есть туры

-- Установка переменных для данных первого отеля
SET @hotel1_name = 'Placeholder Hotel Alpha';
SET @hotel1_desc = 'Комфортабельный отель-заполнитель.';
SET @hotel1_addr = 'ул. Примерная, 123';
SET @hotel1_cat = 3; -- 3 звезды
SET @hotel1_img = '/images/hotels/placeholder_alpha.jpg'; -- Путь к изображению (если есть)

-- Установка переменных для данных второго отеля
SET @hotel2_name = 'Placeholder Hotel Beta';
SET @hotel2_desc = 'Еще один отличный отель-заполнитель.';
SET @hotel2_addr = 'пр. Тестовый, 456';
SET @hotel2_cat = 4; -- 4 звезды
SET @hotel2_img = '/images/hotels/placeholder_beta.jpg'; -- Путь к изображению (если есть)

-- Вставка первого отеля для каждого города с турами
-- Используется INSERT IGNORE, чтобы избежать ошибок, если отель с таким именем уже существует в данном городе
INSERT IGNORE INTO hotels (city_id, name, description, address, category, image_url, is_active)
SELECT DISTINCT t.city_id, @hotel1_name, @hotel1_desc, @hotel1_addr, @hotel1_cat, @hotel1_img, TRUE
FROM tours t
WHERE NOT EXISTS ( -- Проверка, существует ли уже отель с таким именем в этом городе
    SELECT 1 FROM hotels h WHERE h.city_id = t.city_id AND h.name = @hotel1_name
);

-- Вставка второго отеля для каждого города с турами
INSERT IGNORE INTO hotels (city_id, name, description, address, category, image_url, is_active)
SELECT DISTINCT t.city_id, @hotel2_name, @hotel2_desc, @hotel2_addr, @hotel2_cat, @hotel2_img, TRUE
FROM tours t
WHERE NOT EXISTS ( -- Проверка, существует ли уже отель с таким именем в этом городе
    SELECT 1 FROM hotels h WHERE h.city_id = t.city_id AND h.name = @hotel2_name
);

-- Сброс переменных (хорошая практика)
SET @hotel1_name = NULL;
SET @hotel1_desc = NULL;
SET @hotel1_addr = NULL;
SET @hotel1_cat = NULL;
SET @hotel1_img = NULL;

SET @hotel2_name = NULL;
SET @hotel2_desc = NULL;
SET @hotel2_addr = NULL;
SET @hotel2_cat = NULL;
SET @hotel2_img = NULL;