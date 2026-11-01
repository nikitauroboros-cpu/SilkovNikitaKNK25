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
$formErrors = [];
$title = is_string($_POST['title'] ?? null) ? $_POST['title'] : '';
$deadline = is_string($_POST['deadline'] ?? null) ? $_POST['deadline'] : '';
$feedback = $_SESSION['feedback'] ?? null;
unset($_SESSION['feedback']);
$tasks = [];
$repo = null;
$redirect = false;
$requestHandled = false;
try {
    /** @var TaskStorageInterface $repo */
    $repo = new TaskRepository(__DIR__ . '/tasks.json');
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        try {
            $action = $_POST['action'] ?? '';
            if ($action === 'add') {
                if (!is_string($_POST['title'] ?? '') || !is_string($_POST['deadline'] ?? '')) {
                    throw new ValidationException(['Некоректний формат полів форми.']);
                }
                $repo->add($title, trim($deadline) ?: null);
                $_SESSION['feedback'] = 'Завдання успішно додано!';
            } elseif ($action === 'complete' || $action === 'delete') {
                $id = filter_var($_POST['id'] ?? null, FILTER_VALIDATE_INT);
                if ($id === false || $id === null || $id < 1) {
                    throw new ValidationException(['Ідентифікатор має бути додатним цілим числом.']);
                }
                if ($action === 'complete') $repo->complete($id);
                else $repo->delete($id);
                $_SESSION['feedback'] = $action === 'complete' ? 'Статус завдання оновлено!' : 'Завдання видалено!';
            } else {
                throw new ValidationException(['Невідома дія.']);
            }
            $redirect = true;
        } catch (ValidationException $exception) {
            http_response_code(422);
            $formErrors = $exception->getErrors();
        } catch (TaskNotFoundException $exception) {
            http_response_code(404);
            $formErrors = [$exception->getMessage()];
        } catch (TaskManagerException $exception) {
            http_response_code(500);
            $formErrors = ['Помилка програми: ' . $exception->getMessage()];
        } catch (Throwable $exception) {
            http_response_code(500);
            error_log((string) $exception);
            $formErrors = ['Не вдалося зберегти завдання. Перевірте файл і права доступу.'];
        } finally {
            // This executes before redirect/exit, for successful and failed POSTs.
            $requestHandled = true;
        }
    }
    $tasks = $repo->findAll();
} catch (Throwable $exception) {
    http_response_code(500);
    error_log((string) $exception);
    $formErrors = ['Не вдалося відкрити сховище завдань. Перевірте tasks.json та права доступу.'];
}
if ($redirect && $requestHandled) {
    header('Location: index.php', true, 303);
    exit;
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
        .alert-error { background:#ffe3e3; color:#a20b19; border:1px solid #ffa8a8; padding:16px; }
        .alert-success { background:#d3f9d8; color:#2b8a3e; padding:16px; }
        .task-meta { font-size:0.85em; color:#555; }
        input { padding:8px; } form { margin:12px 0; }
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
            Виконано: <?= $repo?->countCompleted() ?? 0 ?> |
            Прострочено: <?= $repo?->countOverdue() ?? 0 ?></p>
        <?php if ($feedback): ?>
            <p class="alert-success" role="status"><?= htmlspecialchars($feedback, ENT_QUOTES, 'UTF-8') ?></p>
        <?php endif; ?>
        <?php if ($formErrors): ?>
            <div class="alert-error" role="alert"><strong>Виявлено помилки:</strong><ul>
                <?php foreach ($formErrors as $message): ?>
                    <li><?= htmlspecialchars($message, ENT_QUOTES, 'UTF-8') ?></li>
                <?php endforeach; ?>
            </ul></div>
        <?php endif; ?>
        <form method="POST" action="index.php">
            <input type="hidden" name="action" value="add">
            <label>Назва завдання <input name="title" value="<?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?>"></label>
            <label>Дедлайн <input type="date" name="deadline" value="<?= htmlspecialchars($deadline, ENT_QUOTES, 'UTF-8') ?>"></label>
            <button type="submit">Додати</button>
        </form>
        <ul>
            <?php foreach ($tasks as $task): ?>
                <li class="<?= $task->isCompleted() ? 'task-done' : ($task->isOverdue() ? 'task-overdue' : 'task-pending') ?>">
                    №<?= $task->getId() ?>:
                    <span title="<?= htmlspecialchars($task->getTitle(), ENT_QUOTES, 'UTF-8') ?>"><?= htmlspecialchars(formatTitle($task->getTitle()), ENT_QUOTES, 'UTF-8') ?></span> —
                    Пріоритет: <?= htmlspecialchars($task->getPriority(), ENT_QUOTES, 'UTF-8') ?> —
                    <?= $task->getStatusLabel() ?> —
                    Дедлайн: <?= htmlspecialchars($task->getDeadline() ?? 'не задано', ENT_QUOTES, 'UTF-8') ?>
                    <p class="task-meta">Створено: <?= htmlspecialchars($task->getCreatedAt(), ENT_QUOTES, 'UTF-8') ?>
                    <?php if ($task->getUpdatedAt() !== null): ?>
                        | Оновлено: <?= htmlspecialchars($task->getUpdatedAt(), ENT_QUOTES, 'UTF-8') ?>
                    <?php endif; ?></p>
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
