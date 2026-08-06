const requestQueue: Array<{
  operation: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}> = [];

let isProcessing = false;
let lastRequestTime = 0;

const MIN_REQUEST_INTERVAL = 1500;
const MAX_CONCURRENT = 2;
let concurrentRequests = 0;

const cooldownUntil: { [key: string]: number } = {};
const DEFAULT_COOLDOWN = 30000;

export function setCooldown(key: string, durationMs: number = DEFAULT_COOLDOWN): void {
  cooldownUntil[key] = Date.now() + durationMs;
}

export function isInCooldown(key: string): boolean {
  const cooldown = cooldownUntil[key];
  return cooldown ? Date.now() < cooldown : false;
}

export function clearCooldown(key: string): void {
  delete cooldownUntil[key];
}

async function processQueue(): Promise<void> {
  if (isProcessing || requestQueue.length === 0) return;
  
  isProcessing = true;
  
  while (requestQueue.length > 0) {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await sleep(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
    }
    
    if (concurrentRequests >= MAX_CONCURRENT) {
      await sleep(500);
      continue;
    }
    
    const nextRequest = requestQueue.shift();
    if (!nextRequest) continue;
    
    concurrentRequests++;
    lastRequestTime = Date.now();

    // Do NOT await here: awaiting serialized the queue so concurrentRequests
    // never exceeded 1 and MAX_CONCURRENT was dead code.
    nextRequest
      .operation()
      .then((result) => nextRequest.resolve(result))
      .catch((error) => nextRequest.reject(error))
      .finally(() => {
        concurrentRequests--;
      });
  }
  
  isProcessing = false;
}

export async function withRateLimit<T>(
  key: string,
  operation: () => Promise<T>,
  cooldownOnError: boolean = true
): Promise<T> {
  if (isInCooldown(key)) {
    const waitTime = cooldownUntil[key]! - Date.now();
    throw new Error(`Rate limited for ${Math.ceil(waitTime / 1000)}s. Please wait.`);
  }

  return new Promise<T>((resolve, reject) => {
    requestQueue.push({
      operation: async () => {
        try {
          const result = await operation();
          return result;
        } catch (error: any) {
          if (cooldownOnError && error?.status === 429) {
            console.warn(`[RateLimiter] 429 received, setting cooldown for ${key}`);
            setCooldown(key, 60000);
          }
          throw error;
        }
      },
      resolve: (value) => resolve(value as T),
      reject,
    });
    
    processQueue();
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getQueueStatus(): { queueLength: number; concurrent: number; inCooldown: string[] } {
  const cooldowns = Object.entries(cooldownUntil)
    .filter(([, time]) => Date.now() < time)
    .map(([key]) => key);
  
  return {
    queueLength: requestQueue.length,
    concurrent: concurrentRequests,
    inCooldown: cooldowns,
  };
}

export function clearAllCooldowns(): void {
  Object.keys(cooldownUntil).forEach(key => delete cooldownUntil[key]);
}
