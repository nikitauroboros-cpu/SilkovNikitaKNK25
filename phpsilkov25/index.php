<?php
declare(strict_types=1);
session_start();
require_once __DIR__ . '/TaskRepository.php';
require_once __DIR__ . '/Database.php';
$userId = $_SESSION['user_id'] ?? null;
if (!is_int($userId) || $userId < 1 || !isset($_SESSION['csrf_token'])) {
    header('Location: login.php');
    exit;
}
date_default_timezone_set('Europe/Kyiv');

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
$perPage = 5;
$page = max(1, filter_var($_GET['page'] ?? 1, FILTER_VALIDATE_INT) ?: 1);
$totalPages = 1;
$totalTasks = $completedCount = $overdueCount = 0;
try {
    /** @var TaskStorageInterface $repo */
    $repo = new TaskRepository(Database::connect());
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        try {
            $token = $_POST['csrf_token'] ?? '';
            if (!is_string($token) || !hash_equals($_SESSION['csrf_token'], $token)) {
                throw new ValidationException(['Оновіть сторінку та повторіть дію.']);
            }
            $action = $_POST['action'] ?? '';
            if ($action === 'add') {
                if (!is_string($_POST['title'] ?? '') || !is_string($_POST['deadline'] ?? '')) {
                    throw new ValidationException(['Некоректний формат полів форми.']);
                }
                $repo->add($title, $userId, trim($deadline) ?: null);
                $_SESSION['feedback'] = 'Завдання успішно додано!';
            } elseif ($action === 'complete' || $action === 'delete') {
                $id = filter_var($_POST['id'] ?? null, FILTER_VALIDATE_INT);
                if ($id === false || $id === null || $id < 1) {
                    throw new ValidationException(['Ідентифікатор має бути додатним цілим числом.']);
                }
                if ($action === 'complete') $repo->complete($id, $userId);
                else $repo->delete($id, $userId);
                $_SESSION['feedback'] = $action === 'complete' ? 'Статус завдання оновлено!' : 'Завдання видалено!';
            } else {
                throw new ValidationException(['Невідома дія.']);
            }
            $destination = $action === 'add' ? 1 : $page;
            header('Location: index.php?page=' . $destination, true, 303);
            exit;
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
            $formErrors = ['Не вдалося зберегти завдання. Перевірте підключення до бази даних.'];
        }
    }
    $totalTasks = $repo->countByUser($userId);
    $totalPages = max(1, (int) ceil($totalTasks / $perPage));
    $page = min($page, $totalPages);
    $tasks = $repo->findAllByUser($userId, $page, $perPage);
    $completedCount = $repo->countCompletedByUser($userId);
    $overdueCount = $repo->countOverdueByUser($userId);
} catch (Throwable $exception) {
    http_response_code(500);
    error_log((string) $exception);
    $formErrors = ['Не вдалося відкрити сховище завдань. Перевірте підключення до бази даних.'];
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
        .pagination { display: flex; flex-wrap: wrap; gap: 8px; }
        .pagination a, .pagination span { padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; }
        .pagination span { background: #174d9b; color: white; }
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
        <p class="stats">Всього: <?= $totalTasks ?> |
            Виконано: <?= $completedCount ?> |
            Прострочено: <?= $overdueCount ?></p>
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
        <form method="POST" action="index.php?page=<?= $page ?>">
            <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token'] ?>">
            <input type="hidden" name="action" value="add">
            <label>Назва завдання <input name="title" value="<?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?>"></label>
            <label>Дедлайн <input type="date" name="deadline" value="<?= htmlspecialchars($deadline, ENT_QUOTES, 'UTF-8') ?>"></label>
            <button type="submit">Додати</button>
        </form>
        <ul>
            <?php foreach ($tasks as $task): ?>
                <li class="<?= $task->isCompleted() ? 'task-done' : ($task->isOverdue() ? 'task-overdue' : 'task-pending') ?>">
                    №<?= $task->getId() ?>:
                    <span title="<?= htmlspecialchars($task->getTitle(), ENT_QUOTES, 'UTF-8') ?>"><?= htmlspecialchars($task->getTitle(), ENT_QUOTES, 'UTF-8') ?></span> —
                    Пріоритет: <?= htmlspecialchars($task->getPriority(), ENT_QUOTES, 'UTF-8') ?> —
                    <?= $task->getStatusLabel() ?> —
                    Дедлайн: <?= htmlspecialchars($task->getDeadline() ?? 'не задано', ENT_QUOTES, 'UTF-8') ?>
                    <p class="task-meta">Створено: <?= htmlspecialchars($task->getCreatedAt(), ENT_QUOTES, 'UTF-8') ?>
                    <?php if ($task->getUpdatedAt() !== null): ?>
                        | Оновлено: <?= htmlspecialchars($task->getUpdatedAt(), ENT_QUOTES, 'UTF-8') ?>
                    <?php endif; ?></p>
                    <?php if (!$task->isCompleted()): ?>
                        <form class="actions" method="POST" action="index.php?page=<?= $page ?>">
                            <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token'] ?>">
                            <input type="hidden" name="id" value="<?= $task->getId() ?>">
                            <button name="action" value="complete" aria-label="Виконати завдання <?= $task->getId() ?>">✓</button>
                        </form>
                    <?php endif; ?>
                    <form class="actions" method="POST" action="index.php?page=<?= $page ?>">
                        <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token'] ?>">
                        <input type="hidden" name="id" value="<?= $task->getId() ?>">
                        <button name="action" value="delete" aria-label="Видалити завдання <?= $task->getId() ?>">✕</button>
                    </form>
                    <?php if ($task->getDescription() !== ''): ?>
                        <p><?= nl2br(htmlspecialchars($task->getDescription(), ENT_QUOTES, 'UTF-8')) ?></p>
                    <?php endif; ?>
                </li>
            <?php endforeach; ?>
        </ul>
        <?php if ($totalPages > 1): ?>
            <nav class="pagination" aria-label="Сторінки завдань">
                <?php if ($page > 1): ?>
                    <a href="?page=<?= $page - 1 ?>">« Назад</a>
                <?php endif; ?>
                <?php for ($number = 1; $number <= $totalPages; $number++): ?>
                    <?php if ($number === $page): ?>
                        <span aria-current="page"><?= $number ?></span>
                    <?php else: ?>
                        <a href="?page=<?= $number ?>"><?= $number ?></a>
                    <?php endif; ?>
                <?php endfor; ?>
                <?php if ($page < $totalPages): ?>
                    <a href="?page=<?= $page + 1 ?>">Вперед »</a>
                <?php endif; ?>
            </nav>
        <?php endif; ?>
    </main>
</body>
</html>
