export interface JobData {
  [key: string]: unknown;
}

export interface Job<T extends JobData = JobData> {
  id: string;
  name: string;
  data: T;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'delayed';
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  processedAt?: string;
  completedAt?: string;
  failedAt?: string;
  error?: string;
}

export interface JobOptions {
  delay?: number; // ms
  maxAttempts?: number;
  backoff?: { type: 'fixed' | 'exponential'; delay: number };
  priority?: number;
  removeOnComplete?: boolean;
  removeOnFail?: boolean;
}

export type JobHandler<T extends JobData = JobData> = (job: Job<T>) => Promise<void>;

export interface IQueueAdapter {
  addJob<T extends JobData>(name: string, data: T, options?: JobOptions): Promise<Job<T>>;
  addBulk<T extends JobData>(jobs: Array<{ name: string; data: T; options?: JobOptions }>): Promise<Job<T>[]>;
  getJob<T extends JobData>(jobId: string): Promise<Job<T> | null>;
  removeJob(jobId: string): Promise<void>;
  registerHandler<T extends JobData>(name: string, handler: JobHandler<T>): void;
  start(): Promise<void>;
  stop(): Promise<void>;
  getQueueStats(): Promise<{ pending: number; active: number; completed: number; failed: number }>;
}
