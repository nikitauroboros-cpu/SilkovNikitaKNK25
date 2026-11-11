<?php
declare(strict_types=1);

require_once __DIR__ . '/TaskStorageInterface.php';

class TaskRepository implements TaskStorageInterface
{
    public function __construct(private PDO $pdo)
    {
    }

    public function findAllByUser(int $userId, int $page = 1, int $perPage = 5): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM tasks WHERE user_id = :user_id ORDER BY id DESC LIMIT :limit OFFSET :offset'
        );
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', ($page - 1) * $perPage, PDO::PARAM_INT);
        $stmt->execute();

        return array_map([Task::class, 'fromArray'], $stmt->fetchAll());
    }

    public function findById(int $id, int $userId): ?Task
    {
        $stmt = $this->pdo->prepare('SELECT * FROM tasks WHERE id = :id AND user_id = :user_id');
        $stmt->execute(['id' => $id, 'user_id' => $userId]);
        $row = $stmt->fetch();

        return $row === false ? null : Task::fromArray($row);
    }

    public function add(string $title, int $userId, ?string $deadline = null,
        string $description = '', string $priority = 'Medium', ?string $avatar = null): Task
    {
        $task = new Task(0, $title, false, $deadline, $description, $priority,
            avatar: $avatar, userId: $userId);
        $stmt = $this->pdo->prepare(
            'INSERT INTO tasks (user_id, title, deadline, description, priority, avatar, created_at)
             VALUES (:user_id, :title, :deadline, :description, :priority, :avatar, :created_at)'
        );
        $stmt->execute([
            'user_id' => $task->userId,
            'title' => $task->getTitle(),
            'deadline' => $task->getDeadline(),
            'description' => $task->getDescription(),
            'priority' => $task->getPriority(),
            'avatar' => $task->getAvatar(),
            'created_at' => $task->getCreatedAt(),
        ]);

        $row = $task->toArray();
        $row['id'] = (int) $this->pdo->lastInsertId();
        return Task::fromArray($row);
    }

    public function complete(int $id, int $userId): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE tasks SET is_completed = 1, updated_at = :updated_at
             WHERE id = :id AND user_id = :user_id'
        );
        $stmt->execute(['updated_at' => date('Y-m-d H:i:s'), 'id' => $id, 'user_id' => $userId]);
        if ($stmt->rowCount() === 0) {
            throw new TaskNotFoundException($id);
        }

        return true;
    }

    public function delete(int $id, int $userId): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM tasks WHERE id = :id AND user_id = :user_id');
        $stmt->execute(['id' => $id, 'user_id' => $userId]);
        if ($stmt->rowCount() === 0) {
            throw new TaskNotFoundException($id);
        }

        return true;
    }

    public function countByUser(int $userId): int
    {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM tasks WHERE user_id = :user_id');
        $stmt->execute(['user_id' => $userId]);

        return (int) $stmt->fetchColumn();
    }

    public function countCompletedByUser(int $userId): int
    {
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM tasks WHERE user_id = :user_id AND is_completed = 1'
        );
        $stmt->execute(['user_id' => $userId]);

        return (int) $stmt->fetchColumn();
    }

    public function countOverdueByUser(int $userId): int
    {
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM tasks
             WHERE user_id = :user_id AND is_completed = 0 AND deadline < :today'
        );
        $stmt->execute(['user_id' => $userId, 'today' => date('Y-m-d')]);

        return (int) $stmt->fetchColumn();
    }
}
