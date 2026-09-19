<?php
date_default_timezone_set('Europe/Kyiv');

function formatTitle($text, $maxLength = 20)
{
    if (strlen($text) > $maxLength) {
        return substr($text, 0, $maxLength) . '...';
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
$taskTitle = 'Learn PHP functions and text formatting';
$taskTimeEstimate = 2;
$isCompleted = false;
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
        <h2>Моє завдання</h2>
        <ul>
            <li class="<?= $isCompleted ? 'task-done' : 'task-pending' ?>">
                Завдання: <?= formatTitle($taskTitle) ?> —
                <?php if ($isCompleted): ?>
                    ✔️ Виконано
                <?php else: ?>
                    🕒 В процесі
                <?php endif; ?>
            </li>
            <li>Очікуваний час: <?= $taskTimeEstimate ?> год.</li>
        </ul>
    </main>
</body>
</html>
