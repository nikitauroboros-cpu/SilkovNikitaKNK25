<?php
declare(strict_types=1);
session_start();
require_once __DIR__ . '/TaskRepository.php';
if (($_SESSION['is_logged_in'] ?? false) !== true) {
    header('Location: login.php');
    exit;
}
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
$error = '';
try {
    $repo = new TaskRepository(__DIR__ . '/tasks.json');
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $id = filter_var($_POST['id'] ?? null, FILTER_VALIDATE_INT);
        $action = $_POST['action'] ?? '';
        if ($id === false || $id === null || !in_array($action, ['complete', 'delete'], true)) {
            http_response_code(400);
            $error = 'Некоректна дія або ідентифікатор.';
        } else {
            $changed = $action === 'complete' ? $repo->complete($id) : $repo->delete($id);
            if (!$changed) {
                http_response_code(404);
                $error = 'Завдання не знайдено.';
            } else {
                header('Location: index.php', true, 303);
                exit;
            }
        }
    }
    $tasks = $repo->findAll();
} catch (Throwable $exception) {
    http_response_code(500);
    exit('Не вдалося прочитати або зберегти tasks.json. Перевірте файл і права доступу.');
}
?>
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $appName ?></title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1000px; margin: 30px auto; padding: 0 20px; }
        li { margin: 14px 0; }
        .actions { display: inline; }
        button { margin-left: 8px; }
        .stats { background: #f2f2f2; padding: 12px; }
        .task-overdue { color: #a20b19; }
        .task-done { color: green; }
        .task-pending { color: gray; }
    </style>
</head>
<body>
    <header>
        <?php if (($_SESSION['is_logged_in'] ?? false) === true): ?>
            <p>Привіт, <?= htmlspecialchars($_SESSION['user_name'], ENT_QUOTES, 'UTF-8') ?>! <a href="logout.php">Вийти</a></p>
        <?php else: ?>
            <p>Ви увійшли як Гість. <a href="login.php">Увійти</a></p>
        <?php endif; ?>
        <h1><?= $appName ?></h1>
        <p><?= getCurrentGreeting() ?>!</p>
    </header>
    <main>
        <h2>Мої завдання</h2>
        <p><a href="create.php">Додати нове завдання</a></p>
        <?php if (($_GET['created'] ?? '') === '1'): ?>
            <p>Завдання збережено.</p>
        <?php endif; ?>
        <p class="stats">Всього: <?= count($tasks) ?> |
            Виконано: <?= $repo->countCompleted() ?> |
            Прострочено: <?= $repo->countOverdue() ?></p>
        <?php if ($error !== ''): ?>
            <p role="alert"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></p>
        <?php endif; ?>
        <ul>
            <?php foreach ($tasks as $task): ?>
                <li class="<?= $task->isCompleted() ? 'task-done' : ($task->isOverdue() ? 'task-overdue' : 'task-pending') ?>">
                    №<?= $task->getId() ?>:
                    <span title="<?= htmlspecialchars($task->getTitle(), ENT_QUOTES, 'UTF-8') ?>"><?= htmlspecialchars(formatTitle($task->getTitle()), ENT_QUOTES, 'UTF-8') ?></span> —
                    Пріоритет: <?= htmlspecialchars($task->getPriority(), ENT_QUOTES, 'UTF-8') ?> —
                    <?= $task->getStatusLabel() ?> —
                    Дедлайн: <?= htmlspecialchars($task->getDeadline() ?? 'не задано', ENT_QUOTES, 'UTF-8') ?>
                    <?php if (!$task->isCompleted()): ?>
                        <form class="actions" method="POST" action="index.php">
                            <input type="hidden" name="id" value="<?= $task->getId() ?>">
                            <button name="action" value="complete" aria-label="Виконати завдання <?= $task->getId() ?>">✓</button>
                        </form>
                    <?php endif; ?>
                    <form class="actions" method="POST" action="index.php">
                        <input type="hidden" name="id" value="<?= $task->getId() ?>">
                        <button name="action" value="delete" aria-label="Видалити завдання <?= $task->getId() ?>">✕</button>
                    </form>
                    <?php if ($task->getDescription() !== ''): ?>
                        <p><?= nl2br(htmlspecialchars($task->getDescription(), ENT_QUOTES, 'UTF-8')) ?></p>
                    <?php endif; ?>
                </li>
            <?php endforeach; ?>
        </ul>
    </main>
</body>
</html>
