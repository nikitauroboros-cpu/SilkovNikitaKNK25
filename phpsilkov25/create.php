<?php
declare(strict_types=1);
session_start();
require_once __DIR__ . '/TaskRepository.php';
if (($_SESSION['is_logged_in'] ?? false) !== true) {
    header('Location: login.php');
    exit;
}
date_default_timezone_set('Europe/Kyiv');
$title = '';
$description = '';
$priority = '';
$deadline = '';
$errors = [];
$method = ($_GET['method'] ?? '') === 'GET' ? 'GET' : 'POST';
$isDemo = isset($_GET['demo']) || $method === 'GET';
$submitted = $_SERVER['REQUEST_METHOD'] === 'POST' || ($method === 'GET' && isset($_GET['title']));
$dump = '';
$avatarPath = null;
$saved = false;
function escape($value)
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
if ($submitted) {
    $input = $_SERVER['REQUEST_METHOD'] === 'POST' ? $_POST : $_GET;
    foreach (['title', 'description', 'priority', 'deadline'] as $field) {
        if (isset($input[$field]) && !is_string($input[$field])) {
            $errors[] = 'Некоректний формат поля ' . $field;
        }
    }
    $title = trim(is_string($input['title'] ?? null) ? $input['title'] : '');
    $description = trim(is_string($input['description'] ?? null) ? $input['description'] : '');
    $priority = trim(is_string($input['priority'] ?? null) ? $input['priority'] : '');
    $deadline = trim(is_string($input['deadline'] ?? null) ? $input['deadline'] : '');
    if ($deadline !== '') {
        $date = DateTimeImmutable::createFromFormat('!Y-m-d', $deadline);
        if (!$date || $date->format('Y-m-d') !== $deadline) {
            $errors[] = 'Вкажіть коректну дату дедлайну.';
        }
    }
    if ($title === '') {
        $errors[] = 'Назва є обов’язковою.';
    }
    if ($description === '') {
        $errors[] = 'Опис є обов’язковим.';
    }
    if (!in_array($priority, ['Low', 'Medium', 'High'], true)) {
        $errors[] = 'Оберіть пріоритет Low, Medium або High.';
    }
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        require __DIR__ . '/upload.php';
        ob_start();
        var_dump($_FILES);
        $dump = ob_get_clean();
    }
    if ($isDemo) {
        ob_start();
        echo "\$_POST:\n";
        var_dump($_POST);
        echo "\n\$_GET:\n";
        var_dump($_GET);
        $dump = ob_get_clean() . "\n\$_FILES:\n" . $dump;
    } elseif (empty($errors)) {
        try {
            $repo = new TaskRepository(__DIR__ . '/tasks.json');
            $repo->add($title, $deadline ?: null, $description, $priority, $avatarPath);
        } catch (Throwable $error) {
            $errors[] = 'Не вдалося зберегти завдання. Перевірте файл tasks.json та права запису.';
        }
        if (!empty($errors) && $avatarPath !== null) {
            unlink(__DIR__ . '/' . $avatarPath);
            $avatarPath = null;
        }
        $saved = empty($errors);
        if ($saved && $avatarPath === null) {
            header('Location: index.php?created=1', true, 303);
            exit;
        }
    }
}
?>
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Створити завдання</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 700px; margin: 30px auto; padding: 0 20px; }
        label { display: block; margin-top: 16px; }
        input, textarea, select { box-sizing: border-box; width: 100%; padding: 9px; margin-top: 6px; font: inherit; }
        button { margin-top: 18px; padding: 10px 22px; }
        .alert-danger { color: #a20b19; background: #fff0f0; padding: 12px; margin: 20px 0; border: 1px solid #a20b19; }
        pre { background: #f2f2f2; padding: 15px; white-space: pre-wrap; overflow-wrap: anywhere; }
    </style>
</head>
<body>
    <a href="index.php">Повернутись до списку</a>
    <h1>Створити завдання</h1>
    <p><a href="create.php">Збереження</a> · <a href="create.php?demo=1">Перевірка POST</a> · <a href="create.php?method=GET">Перевірка GET</a></p>
    <?php if ($isDemo): ?>
        <p>Перевірка <?= escape($method) ?>: дані виводяться через var_dump(), без збереження.</p>
    <?php endif; ?>
    <?php if ($saved && $avatarPath !== null): ?>
        <p>Завдання та зображення збережено: <a href="<?= escape($avatarPath) ?>"><?= escape($avatarPath) ?></a></p>
        <img src="<?= escape($avatarPath) ?>" alt="Завантажене зображення" width="120">
    <?php endif; ?>
    <?php if ($dump !== ''): ?>
        <pre><?= escape($dump) ?></pre>
    <?php endif; ?>
    <?php if (!empty($errors)): ?>
        <div class="alert-danger" role="alert">
            <ul>
                <?php foreach ($errors as $error): ?>
                    <li><?= escape($error) ?></li>
                <?php endforeach; ?>
            </ul>
        </div>
    <?php endif; ?>
    <form action="<?= $method === 'GET' ? 'create.php' : ($isDemo ? 'create.php?demo=1' : 'create.php') ?>" method="<?= escape($method) ?>" enctype="multipart/form-data">
        <?php if ($method === 'GET'): ?>
            <input type="hidden" name="method" value="GET">
        <?php endif; ?>
        <label for="title">Назва завдання</label>
        <input type="text" id="title" name="title" value="<?= escape($title) ?>">
        <label for="deadline">Дедлайн (необов’язково)</label>
        <input type="date" id="deadline" name="deadline" value="<?= escape($deadline) ?>">
        <label for="description">Опис завдання</label>
        <textarea id="description" name="description" rows="4"><?= escape($description) ?></textarea>
        <label for="priority">Пріоритет</label>
        <select id="priority" name="priority">
            <option value="">Оберіть пріоритет</option>
            <?php foreach (['Low', 'Medium', 'High'] as $option): ?>
                <option value="<?= $option ?>" <?= $priority === $option ? 'selected' : '' ?>><?= $option ?></option>
            <?php endforeach; ?>
        </select>
        <?php if ($method === 'POST'): ?>
            <label for="avatar">Зображення (JPG/PNG, до 2 МБ, необов’язково)</label>
            <input type="file" id="avatar" name="avatar" accept="image/png,image/jpeg">
        <?php endif; ?>
        <button type="submit">Зберегти</button>
    </form>
</body>
</html>
