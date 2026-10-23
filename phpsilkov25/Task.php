<?php
declare(strict_types=1);

class Task
{
    public function __construct(
        public readonly int $id,
        private string $title,
        private bool $isCompleted = false,
        private ?string $deadline = null,
        private string $description = '',
        private string $priority = 'Medium',
        private ?string $createdAt = null,
        private ?string $avatar = null,
    ) {
        $this->title = trim($title);
        if ($this->title === '') {
            throw new InvalidArgumentException('Назва завдання не може бути порожньою.');
        }
        if ($deadline !== null) {
            $date = DateTimeImmutable::createFromFormat('!Y-m-d', $deadline);
            if (!$date || $date->format('Y-m-d') !== $deadline) {
                throw new InvalidArgumentException('Вкажіть коректну дату дедлайну.');
            }
        }
        if (!in_array($priority, ['Low', 'Medium', 'High'], true)) {
            throw new InvalidArgumentException('Некоректний пріоритет.');
        }
    }

    public function getId(): int { return $this->id; }
    public function getTitle(): string { return $this->title; }
    public function isCompleted(): bool { return $this->isCompleted; }
    public function getDeadline(): ?string { return $this->deadline; }
    public function getDescription(): string { return $this->description; }
    public function getPriority(): string { return $this->priority; }
    public function getCreatedAt(): ?string { return $this->createdAt; }
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
            'created_at' => $this->createdAt,
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
            createdAt: $data['created_at'] ?? null,
            avatar: $data['avatar'] ?? null,
        );
    }
}
