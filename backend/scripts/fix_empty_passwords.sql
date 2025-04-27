-- Скрипт для выявления и исправления пользователей с пустыми паролями
-- Для использования: mysql -u username -p tourism < fix_empty_passwords.sql

-- Выводим всех пользователей с пустыми паролями
SELECT id, username, email, password 
FROM users 
WHERE password IS NULL OR password = '';

-- Обновляем пароли для пользователей с пустыми паролями
-- Новый пароль будет 'defaultpassword' с предварительным хешированием
-- Примечание: В реальном проекте необходимо менять пароли индивидуально и уведомлять пользователей

-- Это только как пример, не хешированный пароль! В реальности использовать bcrypt
-- Тут просто показано как обновить поле password, при запуске инфраструктуры
-- рекомендуется использовать скрипт Go из fix_users.go
UPDATE users 
SET password = 'временный_хеш_пароля_для_демонстрации' 
WHERE password IS NULL OR password = '';

-- Проверяем, что все пароли обновлены
SELECT COUNT(*) AS 'Число пользователей с пустыми паролями' 
FROM users 
WHERE password IS NULL OR password = '';

-- Выводим общее количество пользователей в системе
SELECT COUNT(*) AS 'Общее число пользователей' 
FROM users;

-- Проверяем таблицу ролей
SELECT * FROM roles;

-- Количество пользователей по ролям
SELECT r.name AS 'Роль', COUNT(u.id) AS 'Количество' 
FROM users u 
JOIN roles r ON u.role_id = r.id 
GROUP BY r.name; 