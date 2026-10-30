/**
 * In-Memory Mock Database Adapter for Testing
 * Implements IDatabaseAdapter
 */

import type {
  IDatabaseAdapter,
  QueryOptions,
  QueryResult,
  SingleResult,
  MutationResult,
  FilterParams,
  ITransactionClient,
} from '@/lib/db/adapter';

export class MockDatabaseAdapter implements IDatabaseAdapter {
  private tables: Map<string, Array<Record<string, unknown>>> = new Map();

  constructor() {}

  seed(table: string, records: Array<Record<string, unknown>>): void {
    this.tables.set(table, [...records]);
  }

  getTable(table: string): Array<Record<string, unknown>> {
    if (!this.tables.has(table)) {
      this.tables.set(table, []);
    }
    return this.tables.get(table)!;
  }

  private matchesFilter(record: Record<string, unknown>, filter: FilterParams): boolean {
    const val = record[filter.column];
    const target = filter.value;

    switch (filter.operator) {
      case 'eq':
        return val === target;
      case 'neq':
        return val !== target;
      case 'gt':
        return Number(val) > Number(target);
      case 'gte':
        return Number(val) >= Number(target);
      case 'lt':
        return Number(val) < Number(target);
      case 'lte':
        return Number(val) <= Number(target);
      case 'in':
        return Array.isArray(target) && target.includes(val);
      case 'like':
      case 'ilike':
        return (
          typeof val === 'string' &&
          typeof target === 'string' &&
          val.toLowerCase().includes(target.replace(/%/g, '').toLowerCase())
        );
      case 'is':
        return val === target;
      default:
        return true;
    }
  }

  async findMany<T>(table: string, options?: QueryOptions): Promise<QueryResult<T>> {
    const records = this.getTable(table);
    let filtered = [...records];

    if (options?.filters) {
      filtered = filtered.filter((r) =>
        options.filters!.every((f) => this.matchesFilter(r, f))
      );
    }

    if (options?.sort) {
      for (const s of options.sort) {
        filtered.sort((a, b) => {
          const valA = a[s.column];
          const valB = b[s.column];
          if (valA === valB) return 0;
          if (valA == null) return 1;
          if (valB == null) return -1;
          const comp = valA > valB ? 1 : -1;
          return s.direction === 'desc' ? -comp : comp;
        });
      }
    }

    if (options?.pagination) {
      const page = options.pagination.page ?? 1;
      const pageSize = options.pagination.pageSize ?? 20;
      filtered = filtered.slice((page - 1) * pageSize, page * pageSize);
    }

    return {
      data: filtered as unknown as T[],
      count: filtered.length,
      error: null,
    };
  }

  async findById<T>(table: string, id: string): Promise<SingleResult<T>> {
    const records = this.getTable(table);
    const item = records.find((r) => r.id === id);
    return {
      data: (item as unknown as T) || null,
      error: null,
    };
  }

  async findOne<T>(table: string, filters: FilterParams[]): Promise<SingleResult<T>> {
    const records = this.getTable(table);
    const item = records.find((r) => filters.every((f) => this.matchesFilter(r, f)));
    return {
      data: (item as unknown as T) || null,
      error: null,
    };
  }

  async count(
    table: string,
    filters?: FilterParams[]
  ): Promise<{ count: number | null; error: null }> {
    const records = this.getTable(table);
    let filtered = [...records];
    if (filters) {
      filtered = filtered.filter((r) => filters.every((f) => this.matchesFilter(r, f)));
    }
    return { count: filtered.length, error: null };
  }

  async insert<T>(table: string, data: Record<string, unknown>): Promise<MutationResult<T>> {
    const records = this.getTable(table);
    const newRecord = {
      id: data.id || (require('node:crypto').randomUUID()),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data,
    };
    records.push(newRecord);
    return {
      data: newRecord as unknown as T,
      error: null,
    };
  }

  async insertMany<T>(
    table: string,
    data: Record<string, unknown>[]
  ): Promise<MutationResult<T[]>> {
    const records = this.getTable(table);
    const inserted: Record<string, unknown>[] = [];
    for (const d of data) {
      const newRecord = {
        id: d.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-0000-0000-' + Math.floor(Math.random() * 1e12).toString().padStart(12, '0')),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...d,
      };
      records.push(newRecord);
      inserted.push(newRecord);
    }
    return {
      data: inserted as unknown as T[],
      error: null,
    };
  }

  async update<T>(
    table: string,
    id: string,
    data: Record<string, unknown>
  ): Promise<MutationResult<T>> {
    const records = this.getTable(table);
    const idx = records.findIndex((r) => r.id === id);
    if (idx === -1) {
      return { data: null, error: { code: 'NOT_FOUND', message: 'Record not found' } };
    }
    const updated = {
      ...records[idx],
      ...data,
      updated_at: new Date().toISOString(),
    };
    records[idx] = updated;
    return {
      data: updated as unknown as T,
      error: null,
    };
  }

  async upsert<T>(table: string, data: Record<string, unknown>): Promise<MutationResult<T>> {
    return this.insert<T>(table, data);
  }

  async softDelete(
    table: string,
    id: string,
    deletedBy: string
  ): Promise<{ error: null }> {
    await this.update(table, id, { is_deleted: true, deleted_by: deletedBy });
    return { error: null };
  }

  async hardDelete(table: string, id: string): Promise<{ error: null }> {
    const records = this.getTable(table);
    const idx = records.findIndex((r) => r.id === id);
    if (idx !== -1) {
      records.splice(idx, 1);
    }
    return { error: null };
  }

  async transaction<T>(fn: (tx: ITransactionClient) => Promise<T>): Promise<T> {
    const txClient: ITransactionClient = {
      insert: (table, data) => this.insert(table, data),
      insertMany: (table, data) => this.insertMany(table, data),
      update: (table, id, data) => this.update(table, id, data),
      softDelete: (table, id, deletedBy) => this.update(table, id, { is_deleted: true, deleted_by: deletedBy }),
      raw: async () => ({ data: [], count: 0, error: null }),
    };
    return fn(txClient);
  }

  async raw<T>(): Promise<QueryResult<T>> {
    return { data: [], count: 0, error: null };
  }
}
