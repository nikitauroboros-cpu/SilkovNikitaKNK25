<?php
$appName = 'Task Manager';
$taskTitle = 'Вивчити основи PHP';
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
    </header>
    <main>
        <h2>Моє завдання</h2>
        <ul>
            <li class="<?= $isCompleted ? 'task-done' : 'task-pending' ?>">
                Завдання: <?= $taskTitle ?> —
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
