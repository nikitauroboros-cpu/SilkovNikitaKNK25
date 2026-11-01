<?php
declare(strict_types=1);
require_once __DIR__ . '/Task.php';

require_once __DIR__ . '/TaskStorageInterface.php';
require_once __DIR__ . '/Exceptions.php';

class TaskRepository implements TaskStorageInterface
{
    /** @var Task[] */
    private array $tasks = [];

    public function __construct(private string $storageFile)
    {
        $this->load();
    }

    /** @return Task[] */
    public function findAll(): array { return $this->tasks; }

    public function findById(int $id): ?Task
    {
        foreach ($this->tasks as $task) {
            if ($task->getId() === $id) return $task;
        }
        return null;
    }

    /** @throws ValidationException */
    public function add(string $title, ?string $deadline = null,
        string $description = '', string $priority = 'Medium', ?string $avatar = null): Task
    {
        return $this->update(function () use ($title, $deadline, $description, $priority, $avatar): Task {
            $task = new Task($this->generateNextId(), $title, false, $deadline,
                $description, $priority, date('Y-m-d H:i:s'), $avatar);
            $this->tasks[] = $task;
            return $task;
        });
    }

    /** @throws TaskNotFoundException */
    public function complete(int $id): bool
    {
        return $this->update(function () use ($id): bool {
            $task = $this->findById($id);
            if ($task === null) throw new TaskNotFoundException($id);
            $task->complete();
            return true;
        });
    }

    /** @throws TaskNotFoundException */
    public function delete(int $id): bool
    {
        return $this->update(function () use ($id): bool {
            foreach ($this->tasks as $key => $task) {
                if ($task->getId() === $id) {
                    unset($this->tasks[$key]);
                    $this->tasks = array_values($this->tasks);
                    return true;
                }
            }
            throw new TaskNotFoundException($id);
        });
    }

    public function countCompleted(): int
    {
        return count(array_filter($this->tasks, fn(Task $task) => $task->isCompleted()));
    }

    public function countOverdue(): int
    {
        return count(array_filter($this->tasks, fn(Task $task) => $task->isOverdue()));
    }

    private function generateNextId(): int
    {
        return empty($this->tasks) ? 1
            : max(array_map(fn(Task $task) => $task->getId(), $this->tasks)) + 1;
    }

    private function load(): void
    {
        if (!file_exists($this->storageFile)) return;
        $file = fopen($this->storageFile, 'r');
        if ($file === false) throw new RuntimeException('Не вдалося відкрити файл завдань.');
        try {
            if (!flock($file, LOCK_SH)) throw new RuntimeException('Не вдалося заблокувати файл.');
            $this->decode(stream_get_contents($file));
        } finally {
            flock($file, LOCK_UN);
            fclose($file);
        }
    }

    private function decode(string $json): void
    {
        $data = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($data) || !array_is_list($data)) {
            throw new RuntimeException('Файл завдань має містити JSON-масив.');
        }
        $this->tasks = array_map(fn(array $item) => Task::fromArray($item), $data);
    }

    // Читання, зміна та запис виконуються під одним блокуванням.
    private function update(callable $change): mixed
    {
        $file = fopen($this->storageFile, 'c+');
        if ($file === false) throw new RuntimeException('Не вдалося відкрити файл для запису.');
        try {
            if (!flock($file, LOCK_EX)) throw new RuntimeException('Не вдалося заблокувати файл.');
            $json = stream_get_contents($file);
            if ($json === '') $this->tasks = [];
            else $this->decode($json);
            $result = $change();
            $this->save($file);
            return $result;
        } finally {
            flock($file, LOCK_UN);
            fclose($file);
        }
    }

    private function save($file): void
    {
        $data = array_map(fn(Task $task) => $task->toArray(), $this->tasks);
        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        rewind($file);
        if (fwrite($file, $json) !== strlen($json) || !ftruncate($file, strlen($json)) || !fflush($file)) {
            throw new RuntimeException('Не вдалося зберегти завдання.');
        }
    }
}
