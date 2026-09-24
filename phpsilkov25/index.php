<?php
date_default_timezone_set('Europe/Kyiv');

function formatTitle($text, $maxLength = 20)
{
    if (mb_strlen($text, 'UTF-8') > $maxLength) {
        return mb_substr($text, 0, $maxLength, 'UTF-8') . '...';
    }

    return $text;
}

function getCurrentGreeting()
{
    $hour = (int) date('H');

    if ($hour >= 6 && $hour < 12) {
        return 'Доброго ранку';
    } elseif ($hour >= 12 && $hour < 18) {
        return 'Добрий день';
    } elseif ($hour >= 18) {
        return 'Добрий вечір';
    }

    return 'Доброї ночі';
}

$appName = 'Task Manager';
$tasks = [
    ['id' => 1, 'title' => 'Виконати лабораторну роботу №5', 'priority' => 'High', 'is_completed' => false],
    ['id' => 2, 'title' => 'Повторити масиви', 'priority' => 'Medium', 'is_completed' => true],
    ['id' => 3, 'title' => 'Перевірити цикл foreach у шаблоні', 'priority' => 'High', 'is_completed' => false],
    ['id' => 4, 'title' => 'Додати скриншот', 'priority' => 'Low', 'is_completed' => true],
    ['id' => 5, 'title' => 'Завантажити звіт на GitHub', 'priority' => 'Medium', 'is_completed' => false],
];
?>
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $appName ?></title>
    <style>
        .task-done { color: green; }
        .task-pending { color: gray; }
    </style>
</head>
<body>
    <header>
        <h1><?= $appName ?></h1>
        <p><?= getCurrentGreeting() ?>!</p>
    </header>
    <main>
        <h2>Мої завдання</h2>
        <ul>
            <?php foreach ($tasks as $task): ?>
                <li class="<?= $task['is_completed'] ? 'task-done' : 'task-pending' ?>">
                    №<?= $task['id'] ?>:
                    <?= htmlspecialchars(formatTitle($task['title']), ENT_QUOTES, 'UTF-8') ?> —
                    Пріоритет: <?= htmlspecialchars($task['priority'], ENT_QUOTES, 'UTF-8') ?> —
                    <?php if ($task['is_completed']): ?>
                        ✔️ Виконано
                    <?php else: ?>
                        🕒 В процесі
                    <?php endif; ?>
                </li>
            <?php endforeach; ?>
        </ul>
    </main>
</body>
</html>
