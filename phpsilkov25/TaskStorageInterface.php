<?php
declare(strict_types=1);

require_once __DIR__ . '/Task.php';

interface TaskStorageInterface
{
    /** @return Task[] */
    public function findAllByUser(int $userId, int $page = 1, int $perPage = 5): array;

    public function findById(int $id, int $userId): ?Task;

    public function add(string $title, int $userId, ?string $deadline = null,
        string $description = '', string $priority = 'Medium', ?string $avatar = null): Task;

    public function complete(int $id, int $userId): bool;

    public function delete(int $id, int $userId): bool;

    public function countByUser(int $userId): int;

    public function countCompletedByUser(int $userId): int;

    public function countOverdueByUser(int $userId): int;
}
