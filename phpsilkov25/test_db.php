<?php
declare(strict_types=1);

// 1. Параметри підключення до СКБД MySQL (налаштування для XAMPP/MAMP)
$host = getenv('DB_HOST') ?: '127.0.0.1';
$port = getenv('DB_PORT') ?: '3306';
$dbname = getenv('DB_NAME') ?: 'task_manager';
$username = getenv('DB_USER') ?: 'root';
$password = getenv('DB_PASSWORD') ?: ''; // За замовчуванням у XAMPP пароль користувача root порожній
$charset  = 'utf8mb4';

// 2. Формування рядка DSN (Data Source Name)
$dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset={$charset}";

$tables = [];
$tasks = [];
$connectionStatus = false;
$errorMessage = null;
$serverInfo = '';

// 3. Конфігурація критичних атрибутів PDO:
// - ATTR_ERRMODE => викидати PDOException у разі будь-якої помилки SQL
// - ATTR_DEFAULT_FETCH_MODE => повертати асоціативні масиви
// - ATTR_EMULATE_PREPARES => вимикати емуляцію підготовлених виразів
$options = [
    PDO::ATTR_TIMEOUT => 3,
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    // Встановлення з'єднання з базою даних
    $pdo = new PDO($dsn, $username, $password, $options);
    $connectionStatus = true;
    $serverInfo = (string)$pdo->getAttribute(PDO::ATTR_SERVER_VERSION);

    // Крок А: Отримання списку таблиць у базі даних за допомогою SHOW TABLES
    $tablesStmt = $pdo->query('SHOW TABLES');
    $tables = $tablesStmt->fetchAll(PDO::FETCH_COLUMN);

    // Крок Б: Отримання тестових записів із таблиці tasks (якщо таблиця вже створена)
    if (in_array('tasks', $tables, true)) {
        $tasksStmt = $pdo->query('SELECT * FROM tasks ORDER BY id ASC');
        $tasks = $tasksStmt->fetchAll();
    }
} catch (PDOException $e) {
    // Перехоплюємо виняток підключення (використовуючи принципи обробки помилок із ЛР №11)
    $connectionStatus = false;
    http_response_code(503);
    $errorMessage = $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <title>Діагностика підключення до БД (MySQL PDO)</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            max-width: 820px;
            margin: 40px auto;
            padding: 0 20px;
            color: #222;
            background-color: #f8f9fa;
        }
        .card {
            background: #fff;
            padding: 24px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.08);
            margin-bottom: 20px;
        }
        h1 { margin-top: 0; font-size: 1.6em; color: #1c7ed6; }
        h2 { font-size: 1.2em; color: #343a40; margin-top: 24px; border-bottom: 1px solid #dee2e6; padding-bottom: 8px; }
        .alert-success {
            background: #d3f9d8;
            border: 1px solid #8ce99a;
            color: #2b8a3e;
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 20px;
        }
        .alert-error {
            background: #ffe3e3;
            border: 1px solid #ffa8a8;
            color: #c92a2a;
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 20px;
        }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: bold;
        }
        .badge-success { background: #40c057; color: #fff; }
        .badge-danger  { background: #fa5252; color: #fff; }
        .badge-info    { background: #228be6; color: #fff; }
        .badge-warning { background: #f59f00; color: #fff; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
        }
        th, td {
            text-align: left;
            padding: 10px 12px;
            border-bottom: 1px solid #dee2e6;
            font-size: 0.95em;
        }
        th { background: #f1f3f5; color: #495057; }
        ul.tables-list { list-style: none; padding: 0; margin: 12px 0; }
        ul.tables-list li {
            padding: 8px 12px;
            background: #e7f5ff;
            color: #1971c2;
            margin-bottom: 6px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 1.05em;
        }
        .nav-links {
            margin-top: 25px;
            padding-top: 15px;
            border-top: 1px solid #dee2e6;
        }
        .nav-links a {
            color: #228be6;
            text-decoration: none;
            font-weight: 500;
        }
        .nav-links a:hover { text-decoration: underline; }
    </style>
</head>
<body>

    <div class="card">
        <h1>Діагностика підключення до БД MySQL</h1>
        <p>Перевірка зв'язку вебдодатка на PHP із базою даних <code><?= htmlspecialchars($dbname) ?></code> через інтерфейс PDO.</p>

        <?php if ($connectionStatus): ?>
            <div class="alert-success">
                <strong>✓ Успішне підключення через PDO!</strong><br>
                PHP успішно з'єднався із сервером бази даних (версія MySQL: <code><?= htmlspecialchars($serverInfo) ?></code>).
            </div>

            <h2>1. Таблиці у базі даних (запит <code>SHOW TABLES</code>)</h2>
            <?php if (!empty($tables)): ?>
                <ul class="tables-list">
                    <?php foreach ($tables as $table): ?>
                        <li>📁 <?= htmlspecialchars($table) ?></li>
                    <?php endforeach; ?>
                </ul>
            <?php else: ?>
                <p>У базі даних немає створених таблиць. Перевірте виконання Кроків 3 та 4.</p>
            <?php endif; ?>

            <h2>2. Тестові записи з таблиці <code>tasks</code> (запит <code>SELECT * FROM tasks</code>)</h2>
            <?php if (!empty($tasks)): ?>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Назва завдання</th>
                            <th>User ID</th>
                            <th>Пріоритет</th>
                            <th>Опис</th>
                            <th>Статус</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($tasks as $task): ?>
                            <tr>
                                <td><strong>#<?= htmlspecialchars((string)($task['id'] ?? '')) ?></strong></td>
                                <td><?= htmlspecialchars((string)($task['title'] ?? '')) ?></td>
                                <td><?= htmlspecialchars((string)($task['user_id'] ?? '')) ?></td>
                                <td>
                                    <?php
                                    $p = $task['priority'] ?? 'Medium';
                                    $badgeClass = match ($p) {
                                        'High' => 'badge-danger',
                                        'Low' => 'badge-info',
                                        default => 'badge-warning',
                                    };
                                    ?>
                                    <span class="badge <?= $badgeClass ?>"><?= htmlspecialchars((string)$p) ?></span>
                                </td>
                                <td><?= htmlspecialchars((string)($task['description'] ?? '—')) ?></td>
                                <td>
                                    <?php if (!empty($task['is_completed'])): ?>
                                        <span class="badge badge-success">Виконано</span>
                                    <?php else: ?>
                                        <span class="badge badge-danger">В процесі</span>
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php else: ?>
                <p>У таблиці <code>tasks</code> поки немає записів. Додайте 2–3 тестові завдання через вкладку «Вставити» (Insert) у phpMyAdmin.</p>
            <?php endif; ?>

        <?php else: ?>
            <div class="alert-error">
                <strong>✗ Помилка підключення до СКБД!</strong><br>
                Не вдалося встановити зв'язок із сервером MySQL.<br>
                <em>Повідомлення PDO:</em> <?= htmlspecialchars($errorMessage ?? 'Невідома помилка') ?>
            </div>

            <p><strong>Поради для діагностики:</strong></p>
            <ul>
                <li>Переконайтеся, що модуль <strong>MySQL</strong> запущено в XAMPP Control Panel (порт 3306 підсвічений зеленим);</li>
                <li>Перевірте коректність назви бази даних у DSN (має бути <code>task_manager</code>);</li>
                <li>Перевірте параметри облікового запису (за замовчуванням користувач <code>root</code> із порожнім паролем).</li>
            </ul>
        <?php endif; ?>

        <div class="nav-links">
            <a href="index.php">← Повернутися до «Менеджера завдань» (index.php)</a>
        </div>
    </div>

</body>
</html>
