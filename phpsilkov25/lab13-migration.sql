-- Застосувати до бази task_manager після імпорту database.sql з ЛР №12.
ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS deadline DATE NULL,
    ADD COLUMN IF NOT EXISTS created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at DATETIME NULL,
    ADD COLUMN IF NOT EXISTS avatar VARCHAR(255) NULL,
    ADD CONSTRAINT fk_tasks_user FOREIGN KEY IF NOT EXISTS (user_id) REFERENCES users(id);

-- Локальний навчальний акаунт. Пароль: Lab13-demo!
INSERT INTO users (username, email, password)
SELECT 'lab13_demo', 'lab13@example.com', '$2y$10$rHZHsbuIYSCnS5CBX3vNcO4v2W0LR.A3sEFCdpJHeccnwp9UR0Oc6'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'lab13_demo');
