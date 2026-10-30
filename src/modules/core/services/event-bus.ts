/**
 * VyaparSuite In-Process Event Bus
 * 
 * Provides decoupled, type-safe publish/subscribe messaging for domain events with:
 * - Async and sync handler execution
 * - Error isolation (preventing one subscriber failure from affecting others)
 * - Wildcard subscriptions ('*')
 * - Execution timeout protection and performance tracking
 * - Handler prioritization
 */

import { logger } from '@/lib/utils/logger';
import { DocumentEvent, DocumentEventType } from '../types/document';

export interface BaseDomainEvent<T = Record<string, unknown>> {
  id: string;
  type: string;
  timestamp: string;
  tenantId?: string;
  companyId?: string;
  userId?: string;
  payload: T;
}

export type EventHandler<E = unknown> = (event: E) => Promise<void> | void;

export interface HandlerOptions {
  priority?: number; // Higher number executed earlier (default: 0)
  timeoutMs?: number; // Max execution time for async handler (default: 10000ms)
}

interface SubscriptionRecord<E = unknown> {
  id: string;
  handler: EventHandler<E>;
  priority: number;
  timeoutMs: number;
  once: boolean;
}

export interface HandlerExecutionResult {
  handlerId: string;
  success: boolean;
  durationMs: number;
  error?: Error;
}

export interface EventEmitResult {
  eventId: string;
  eventType: string;
  totalHandlers: number;
  successCount: number;
  failureCount: number;
  results: HandlerExecutionResult[];
}

export class EventBus {
  private handlers: Map<string, Array<SubscriptionRecord<any>>> = new Map();
  private subscriptionCounter = 0;

  /**
   * Subscribe to a specific event type or all events ('*').
   * Returns an unsubscribe function.
   */
  subscribe<E = unknown>(
    eventType: string,
    handler: EventHandler<E>,
    options?: HandlerOptions
  ): () => void {
    const id = `sub_${++this.subscriptionCounter}_${Date.now()}`;
    const record: SubscriptionRecord<E> = {
      id,
      handler,
      priority: options?.priority ?? 0,
      timeoutMs: options?.timeoutMs ?? 10000,
      once: false,
    };

    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    const list = this.handlers.get(eventType)!;
    list.push(record);
    // Sort by priority descending
    list.sort((a, b) => b.priority - a.priority);

    logger.debug(`Registered event subscriber for '${eventType}'`, { subscriptionId: id });

    return () => this.unsubscribe(eventType, id);
  }

  /**
   * Subscribe to be notified only once.
   */
  subscribeOnce<E = unknown>(
    eventType: string,
    handler: EventHandler<E>,
    options?: HandlerOptions
  ): () => void {
    const id = `sub_once_${++this.subscriptionCounter}_${Date.now()}`;
    const record: SubscriptionRecord<E> = {
      id,
      handler,
      priority: options?.priority ?? 0,
      timeoutMs: options?.timeoutMs ?? 10000,
      once: true,
    };

    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    const list = this.handlers.get(eventType)!;
    list.push(record);
    list.sort((a, b) => b.priority - a.priority);

    return () => this.unsubscribe(eventType, id);
  }

  /**
   * Unsubscribe a registered handler.
   */
  unsubscribe(eventType: string, subscriptionId: string): void {
    const list = this.handlers.get(eventType);
    if (!list) return;

    const filtered = list.filter((item) => item.id !== subscriptionId);
    if (filtered.length === 0) {
      this.handlers.delete(eventType);
    } else {
      this.handlers.set(eventType, filtered);
    }
  }

  /**
   * Emit an event asynchronously to all registered handlers.
   * Isolates errors so that each handler runs regardless of errors in others.
   */
  async emit<E extends { type: string }>(event: E): Promise<EventEmitResult> {
    const eventType = event.type;
    const eventId = (event as any).id || (event as any).documentId || `evt_${Date.now()}`;

    // Get specific and wildcard handlers
    const specificHandlers = this.handlers.get(eventType) || [];
    const wildcardHandlers = this.handlers.get('*') || [];

    const allSubscribers = [...specificHandlers, ...wildcardHandlers].sort(
      (a, b) => b.priority - a.priority
    );

    const emitResult: EventEmitResult = {
      eventId,
      eventType,
      totalHandlers: allSubscribers.length,
      successCount: 0,
      failureCount: 0,
      results: [],
    };

    if (allSubscribers.length === 0) {
      logger.debug(`No subscribers for event: ${eventType}`, { eventId });
      return emitResult;
    }

    logger.debug(`Emitting event '${eventType}' to ${allSubscribers.length} handler(s)`, { eventId });

    // Execute handlers with timeout and error containment
    for (const sub of allSubscribers) {
      const startTime = Date.now();
      let handlerError: Error | undefined;

      try {
        await Promise.race([
          Promise.resolve(sub.handler(event)),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error(`Event handler timed out after ${sub.timeoutMs}ms`)),
              sub.timeoutMs
            )
          ),
        ]);

        emitResult.successCount++;
        emitResult.results.push({
          handlerId: sub.id,
          success: true,
          durationMs: Date.now() - startTime,
        });
      } catch (err) {
        handlerError = err instanceof Error ? err : new Error(String(err));
        emitResult.failureCount++;
        emitResult.results.push({
          handlerId: sub.id,
          success: false,
          durationMs: Date.now() - startTime,
          error: handlerError,
        });

        logger.error(`Error in event handler for '${eventType}'`, handlerError, {
          eventType,
          eventId,
          handlerId: sub.id,
        });
      }

      // Cleanup 'once' subscriptions
      if (sub.once) {
        this.unsubscribe(eventType, sub.id);
        if (eventType !== '*') {
          this.unsubscribe('*', sub.id);
        }
      }
    }

    return emitResult;
  }

  /**
   * Synchronously emit event (runs handlers that return void or promises without awaiting).
   */
  emitSync<E extends { type: string }>(event: E): void {
    const eventType = event.type;
    const specificHandlers = this.handlers.get(eventType) || [];
    const wildcardHandlers = this.handlers.get('*') || [];

    const allSubscribers = [...specificHandlers, ...wildcardHandlers];

    for (const sub of allSubscribers) {
      try {
        const result = sub.handler(event);
        if (result instanceof Promise) {
          result.catch((err) => {
            logger.error(`Async error in sync-emitted event handler for '${eventType}'`, err, {
              handlerId: sub.id,
            });
          });
        }
      } catch (err) {
        logger.error(`Error in sync event handler for '${eventType}'`, err as Error, {
          handlerId: sub.id,
        });
      }

      if (sub.once) {
        this.unsubscribe(eventType, sub.id);
      }
    }
  }

  /**
   * Convenience method for DocumentEvent dispatch.
   */
  async emitDocumentEvent(event: DocumentEvent): Promise<EventEmitResult> {
    return this.emit(event);
  }

  /**
   * Clear all subscriptions or subscriptions for a given event type.
   */
  clear(eventType?: string): void {
    if (eventType) {
      this.handlers.delete(eventType);
    } else {
      this.handlers.clear();
    }
  }

  /**
   * Count active subscribers for an event type.
   */
  subscriberCount(eventType?: string): number {
    if (eventType) {
      return (this.handlers.get(eventType) || []).length;
    }
    let total = 0;
    for (const list of this.handlers.values()) {
      total += list.length;
    }
    return total;
  }
}

// Global default event bus instance
export const eventBus = new EventBus();
