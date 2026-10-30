import { randomUUID } from 'crypto';
import type {
  IQueueAdapter,
  Job,
  JobData,
  JobHandler,
  JobOptions,
} from './adapter';

/**
 * In-Process Background Job Queue Implementation
 * 
 * NOTE FOR PRODUCTION ARCHITECTURE:
 * This in-process queue runs in-memory within the single Node.js runtime.
 * While fully production-tested for single-node / container deployments,
 * for multi-instance horizontal scaling (e.g., multi-pod Kubernetes or
 * serverless edge environments), replace this adapter with a Redis-backed
 * BullMQ / River queue adapter to share state across worker pods.
 */

interface InternalJobRecord<T extends JobData = JobData> {
  job: Job<T>;
  options?: JobOptions;
}

export class InProcessQueueAdapter implements IQueueAdapter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private jobs = new Map<string, InternalJobRecord<any>>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handlers = new Map<string, JobHandler<any>>();
  private pendingQueue: string[] = [];
  private activeJobs = new Set<string>();
  private scheduledTimers = new Map<string, NodeJS.Timeout>();
  private isRunning = true;
  private concurrency: number;

  constructor(options?: { concurrency?: number }) {
    this.concurrency = options?.concurrency ?? 5;
  }

  async addJob<T extends JobData>(
    name: string,
    data: T,
    options?: JobOptions
  ): Promise<Job<T>> {
    const id = randomUUID();
    const isDelayed = Boolean(options?.delay && options.delay > 0);

    const job: Job<T> = {
      id,
      name,
      data,
      status: isDelayed ? 'delayed' : 'pending',
      attempts: 0,
      maxAttempts: options?.maxAttempts ?? 3,
      createdAt: new Date().toISOString(),
    };

    this.jobs.set(id, { job, options });

    if (isDelayed && options?.delay) {
      const timer = setTimeout(() => {
        this.scheduledTimers.delete(id);
        const record = this.jobs.get(id);
        if (record && record.job.status === 'delayed') {
          record.job.status = 'pending';
          this.enqueuePending(id, options.priority);
          this.processNext();
        }
      }, options.delay);

      if (typeof timer.unref === 'function') {
        timer.unref();
      }
      this.scheduledTimers.set(id, timer);
    } else {
      this.enqueuePending(id, options?.priority);
      this.processNext();
    }

    return { ...job };
  }

  async addBulk<T extends JobData>(
    jobs: Array<{ name: string; data: T; options?: JobOptions }>
  ): Promise<Job<T>[]> {
    const created: Job<T>[] = [];
    for (const item of jobs) {
      const job = await this.addJob(item.name, item.data, item.options);
      created.push(job);
    }
    return created;
  }

  async getJob<T extends JobData>(jobId: string): Promise<Job<T> | null> {
    const record = this.jobs.get(jobId);
    if (!record) return null;
    return { ...(record.job as Job<T>) };
  }

  async removeJob(jobId: string): Promise<void> {
    const timer = this.scheduledTimers.get(jobId);
    if (timer) {
      clearTimeout(timer);
      this.scheduledTimers.delete(jobId);
    }

    this.pendingQueue = this.pendingQueue.filter((id) => id !== jobId);
    this.jobs.delete(jobId);
  }

  registerHandler<T extends JobData>(name: string, handler: JobHandler<T>): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.handlers.set(name, handler as JobHandler<any>);
    this.processNext();
  }

  async start(): Promise<void> {
    this.isRunning = true;
    this.processNext();
  }

  async stop(): Promise<void> {
    this.isRunning = false;

    // Clear all scheduled timers
    for (const [, timer] of this.scheduledTimers) {
      clearTimeout(timer);
    }
    this.scheduledTimers.clear();

    // Wait for currently running active jobs to resolve (up to 5s grace period)
    const startTime = Date.now();
    while (this.activeJobs.size > 0 && Date.now() - startTime < 5000) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  async getQueueStats(): Promise<{
    pending: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    let pending = 0;
    let active = 0;
    let completed = 0;
    let failed = 0;

    for (const { job } of this.jobs.values()) {
      switch (job.status) {
        case 'pending':
        case 'delayed':
          pending++;
          break;
        case 'active':
          active++;
          break;
        case 'completed':
          completed++;
          break;
        case 'failed':
          failed++;
          break;
      }
    }

    return { pending, active, completed, failed };
  }

  // ==========================================
  // Private Worker Methods
  // ==========================================

  private enqueuePending(jobId: string, priority?: number): void {
    if (priority && priority > 0) {
      this.pendingQueue.unshift(jobId);
    } else {
      this.pendingQueue.push(jobId);
    }
  }

  private processNext(): void {
    if (!this.isRunning) return;

    while (this.activeJobs.size < this.concurrency && this.pendingQueue.length > 0) {
      const jobId = this.pendingQueue.shift();
      if (!jobId) break;

      const record = this.jobs.get(jobId);
      if (!record || record.job.status !== 'pending') {
        continue;
      }

      const handler = this.handlers.get(record.job.name);
      if (!handler) {
        // Handler not registered yet; return job to the head of pending queue
        this.pendingQueue.unshift(jobId);
        break;
      }

      this.executeJob(record);
    }
  }

  private async executeJob(record: InternalJobRecord): Promise<void> {
    const { job, options } = record;
    this.activeJobs.add(job.id);

    job.status = 'active';
    job.attempts++;
    job.processedAt = new Date().toISOString();

    const handler = this.handlers.get(job.name);

    try {
      if (!handler) {
        throw new Error(`No handler registered for job type: ${job.name}`);
      }

      await handler(job);

      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      job.error = undefined;

      if (options?.removeOnComplete) {
        this.jobs.delete(job.id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      job.error = errorMessage;

      if (job.attempts < job.maxAttempts) {
        job.status = 'delayed';

        // Compute backoff delay
        let retryDelay = 1000;
        if (options?.backoff) {
          if (options.backoff.type === 'exponential') {
            retryDelay = options.backoff.delay * Math.pow(2, job.attempts - 1);
          } else {
            retryDelay = options.backoff.delay;
          }
        } else {
          // Default exponential backoff: 1s, 2s, 4s...
          retryDelay = Math.min(1000 * Math.pow(2, job.attempts - 1), 30000);
        }

        const timer = setTimeout(() => {
          this.scheduledTimers.delete(job.id);
          const currentRecord = this.jobs.get(job.id);
          if (currentRecord && currentRecord.job.status === 'delayed') {
            currentRecord.job.status = 'pending';
            this.enqueuePending(job.id, options?.priority);
            this.processNext();
          }
        }, retryDelay);

        if (typeof timer.unref === 'function') {
          timer.unref();
        }
        this.scheduledTimers.set(job.id, timer);
      } else {
        job.status = 'failed';
        job.failedAt = new Date().toISOString();

        if (options?.removeOnFail) {
          this.jobs.delete(job.id);
        }
      }
    } finally {
      this.activeJobs.delete(job.id);
      this.processNext();
    }
  }
}

export function createInProcessQueueAdapter(options?: { concurrency?: number }): IQueueAdapter {
  return new InProcessQueueAdapter(options);
}
