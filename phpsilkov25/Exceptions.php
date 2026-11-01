<?php
declare(strict_types=1);

/**
 * Базовий клас для всіх доменних помилок у системі управління завданнями.
 */
class TaskManagerException extends RuntimeException {}

/**
 * Виняток, що виникає при зверненні до завдання за неіснуючим ID.
 */
class TaskNotFoundException extends TaskManagerException
{
    public function __construct(int $taskId)
    {
        parent::__construct("Завдання з ідентифікатором #{$taskId} не знайдено.", 404);
    }
}

/**
 * Виняток валідації вхідних даних (може містити перелік із кількох помилок).
 */
class ValidationException extends TaskManagerException
{
    /** @var string[] */
    private array $errors;

    public function __construct(array $errors)
    {
        $this->errors = $errors;
        parent::__construct('Помилка валідації даних форми: ' . implode(', ', $errors), 422);
    }

    /**
     * Повертає масив текстових повідомлень про помилки.
     *
     * @return string[]
     */
    public function getErrors(): array
    {
        return $this->errors;
    }
}

