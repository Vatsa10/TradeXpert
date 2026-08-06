export type TaskPriority = 1 | 2 | 3;

export interface QueuedTask<T> {
  id: string;
  priority: TaskPriority;
  timeoutMs: number;
  task: () => Promise<T>;
}

export interface QueueOptions {
  concurrency?: number;
  stageTimeoutMs?: Partial<Record<TaskPriority, number>>;
}

export interface QueueRunResult {
  results: Record<string, unknown>;
  errors: Record<string, string>;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("Task timeout")), timeoutMs);
    }),
  ]);
}

async function runBatch(
  tasks: QueuedTask<unknown>[],
  concurrency: number,
  stageTimeoutMs: number,
  results: Record<string, unknown>,
  errors: Record<string, string>
): Promise<void> {
  if (tasks.length === 0) return;

  const start = Date.now();
  let index = 0;

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }).map(async () => {
    while (index < tasks.length) {
      if (Date.now() - start > stageTimeoutMs) {
        console.error(
          `[Queue] stage-budget-exhausted stageTimeoutMs=${stageTimeoutMs} elapsedMs=${Date.now() - start} skipped=${tasks.length - index}`
        );
        return;
      }

      const currentIndex = index;
      index += 1;
      const task = tasks[currentIndex];

      if (!task) continue;

      try {
        const value = await withTimeout(task.task(), task.timeoutMs);
        results[task.id] = value;
      } catch (error: any) {
        const message = error?.message || "Unknown queue task error";
        errors[task.id] = message;
        // Timeouts used to vanish into the errors map; log which upstream blew
        // which configured budget so slow providers are greppable.
        console.error(
          `[Queue] task-failed upstream=${task.id} priority=${task.priority} timeoutMs=${task.timeoutMs} stageTimeoutMs=${stageTimeoutMs} error=${String(message).replace(/\s+/g, " ").slice(0, 200)}`
        );
      }
    }
  });

  await Promise.all(workers);
}

export async function runPriorityQueue(
  tasks: QueuedTask<unknown>[],
  options: QueueOptions = {}
): Promise<QueueRunResult> {
  const concurrency = options.concurrency ?? 4;
  const stageTimeoutMs = {
    1: options.stageTimeoutMs?.[1] ?? 4000,
    2: options.stageTimeoutMs?.[2] ?? 6000,
    3: options.stageTimeoutMs?.[3] ?? 5000,
  };

  const results: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  const p1 = tasks.filter((t) => t.priority === 1);
  const p2 = tasks.filter((t) => t.priority === 2);
  const p3 = tasks.filter((t) => t.priority === 3);

  await runBatch(p1, concurrency, stageTimeoutMs[1], results, errors);
  await runBatch(p2, concurrency, stageTimeoutMs[2], results, errors);
  await runBatch(p3, Math.max(1, concurrency - 1), stageTimeoutMs[3], results, errors);

  return { results, errors };
}
