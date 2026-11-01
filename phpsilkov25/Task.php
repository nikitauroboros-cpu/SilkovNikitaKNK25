<?php
declare(strict_types=1);

require_once __DIR__ . '/TimestampableTrait.php';
require_once __DIR__ . '/Exceptions.php';

class Task
{
    use TimestampableTrait;
    public function __construct(
        public readonly int $id,
        private string $title,
        private bool $isCompleted = false,
        private ?string $deadline = null,
        private string $description = '',
        private string $priority = 'Medium',
        ?string $createdAt = null,
        private ?string $avatar = null,
        ?string $updatedAt = null,
    ) {
        $this->initTimestamps($createdAt, $updatedAt);
        $this->title = trim($title);
        $errors = [];
        if ($this->title === '') {
            $errors[] = 'Назва завдання є обов’язковою для заповнення.';
        } elseif (mb_strlen($this->title, 'UTF-8') < 3) {
            $errors[] = 'Назва завдання повинна містити щонайменше 3 символи.';
        }
        if ($deadline === '') $this->deadline = null;
        if ($this->deadline !== null) {
            $date = DateTimeImmutable::createFromFormat('!Y-m-d', $this->deadline);
            if (!$date || $date->format('Y-m-d') !== $this->deadline) {
                $errors[] = 'Вкажіть коректну дату дедлайну.';
            }
        }
        if (!in_array($priority, ['Low', 'Medium', 'High'], true)) {
            $errors[] = 'Некоректний пріоритет.';
        }
        if ($errors !== []) throw new ValidationException($errors);
    }

    public function getId(): int { return $this->id; }
    public function getTitle(): string { return $this->title; }
    public function isCompleted(): bool { return $this->isCompleted; }
    public function getDeadline(): ?string { return $this->deadline; }
    public function getDescription(): string { return $this->description; }
    public function getPriority(): string { return $this->priority; }
    public function getAvatar(): ?string { return $this->avatar; }

    public function isOverdue(): bool
    {
        // Поле date задає день: завдання прострочене після завершення цього дня.
        return !$this->isCompleted && $this->deadline !== null
            && $this->deadline < date('Y-m-d');
    }

    public function complete(): void
    {
        $this->isCompleted = true;
        $this->touch();
    }

    public function getStatusLabel(): string
    {
        if ($this->isCompleted) return 'Виконано';
        if ($this->isOverdue()) return 'Прострочено';
        return 'В процесі';
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'isCompleted' => $this->isCompleted,
            'deadline' => $this->deadline,
            'description' => $this->description,
            'priority' => $this->priority,
            'createdAt' => $this->getCreatedAt(),
            'updatedAt' => $this->getUpdatedAt(),
            'avatar' => $this->avatar,
        ];
    }

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            title: $data['title'],
            isCompleted: $data['isCompleted'] ?? $data['is_completed'] ?? false,
            deadline: $data['deadline'] ?? null,
            description: $data['description'] ?? '',
            priority: $data['priority'] ?? 'Medium',
            createdAt: $data['createdAt'] ?? $data['created_at'] ?? null,
            updatedAt: $data['updatedAt'] ?? null,
            avatar: $data['avatar'] ?? null,
        );
    }
}
