<?php
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    http_response_code(404);
    exit;
}
$avatarPath = null;
$avatar = $_FILES['avatar'] ?? null;
if ($avatar !== null) {
    if (!is_array($avatar) || !is_int($avatar['error'] ?? null)) {
        $errors[] = 'Некоректний формат завантаження.';
    } elseif ($avatar['error'] === UPLOAD_ERR_NO_FILE) {
        $avatar = null;
    } elseif ($avatar['error'] !== UPLOAD_ERR_OK) {
        $errors[] = in_array($avatar['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)
            ? 'Файл завеликий! Максимум 2 МБ.'
            : 'Помилка завантаження файлу. Спробуйте ще раз.';
    } elseif (!is_string($avatar['name'] ?? null) || !is_string($avatar['tmp_name'] ?? null)
        || !is_int($avatar['size'] ?? null) || !is_uploaded_file($avatar['tmp_name'])) {
        $errors[] = 'Некоректний файл.';
    } else {
        $extension = strtolower(pathinfo($avatar['name'], PATHINFO_EXTENSION));
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($avatar['tmp_name']);
        $types = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png'];
        if ($avatar['size'] > 2 * 1024 * 1024) {
            $errors[] = 'Файл завеликий! Максимум 2 МБ.';
        }
        if (!isset($types[$extension]) || $types[$extension] !== $mime
            || @getimagesize($avatar['tmp_name']) === false) {
            $errors[] = 'Дозволено лише справжні зображення JPG або PNG.';
        }
        if (empty($errors) && !$isDemo) {
            $directory = __DIR__ . '/uploads';
            if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
                $errors[] = 'Не вдалося створити папку uploads.';
            } else {
                $avatarPath = 'uploads/avatar_' . bin2hex(random_bytes(8)) . '.' . $extension;
                if (!move_uploaded_file($avatar['tmp_name'], __DIR__ . '/' . $avatarPath)) {
                    $errors[] = 'Не вдалося зберегти зображення.';
                    $avatarPath = null;
                }
            }
        }
    }
}
