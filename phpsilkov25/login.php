<?php
session_start();
$error = '';
$username = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = is_string($_POST['username'] ?? null) ? $_POST['username'] : '';
    $password = is_string($_POST['password'] ?? null) ? $_POST['password'] : '';
    if ($username === 'admin' && $password === '12345') {
        session_regenerate_id(true);
        $_SESSION['is_logged_in'] = true;
        $_SESSION['user_name'] = 'Адміністратор';
        header('Location: index.php', true, 303);
        exit;
    }
    $error = 'Невірний логін або пароль!';
}
?>
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Вхід</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 700px; margin: 30px auto; padding: 0 20px; }
        label { display: block; margin-top: 16px; }
        input { box-sizing: border-box; width: 100%; padding: 9px; margin-top: 6px; font: inherit; }
        button { margin-top: 18px; padding: 10px 22px; }
        .error { color: #a20b19; background: #fff0f0; padding: 12px; }
    </style>
</head>
<body>
    <a href="index.php">На головну</a>
    <h1>Вхід</h1>
    <?php if ($error !== ''): ?>
        <p class="error" role="alert"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></p>
    <?php endif; ?>
    <form action="login.php" method="POST">
        <label for="username">Логін</label>
        <input type="text" id="username" name="username" autocomplete="username" value="<?= htmlspecialchars($username, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>">
        <label for="password">Пароль</label>
        <input type="password" id="password" name="password" autocomplete="current-password">
        <button type="submit">Увійти</button>
    </form>
</body>
</html>
