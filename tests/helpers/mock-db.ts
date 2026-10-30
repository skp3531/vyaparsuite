/**
 * In-memory Mock Database Adapter for VyaparSuite Unit & Integration Tests.
 * Fully implements IDatabaseAdapter without requiring a running PostgreSQL or Supabase instance.
 */

import { randomUUID } from 'node:crypto';
import type {
  IDatabaseAdapter,
  ITransactionClient,
  FilterParams,
  QueryOptions,
  QueryResult,
  SingleResult,
  MutationResult,
} from '@/lib/db/adapter';

export class MockDatabaseAdapter implements IDatabaseAdapter {
  // Store table data: tableName -> (id -> record)
  private tables: Map<string, Map<string, Record<string, unknown>>> = new Map();

  // Naming series counter store: `${tenant_id}:${company_id}:${series_key}` -> number
  private namingSeriesCounters: Map<string, number> = new Map();

  constructor() {}

  // Helper to clear database between tests
  reset(): void {
    this.tables.clear();
    this.namingSeriesCounters.clear();
  }

  // Helper to seed table data
  seed<T extends Record<string, unknown>>(table: string, records: T[]): void {
    if (!this.tables.has(table)) {
      this.tables.set(table, new Map());
    }
    const tableMap = this.tables.get(table)!;
    for (const record of records) {
      const id = (record.id as string) || `seed-${Math.random().toString(36).slice(2, 9)}`;
      tableMap.set(id, { ...record, id });
    }
  }

  getTableRecords(table: string): Record<string, unknown>[] {
    const tableMap = this.tables.get(table);
    return tableMap ? Array.from(tableMap.values()) : [];
  }

  private getOrCreateTable(table: string): Map<string, Record<string, unknown>> {
    if (!this.tables.has(table)) {
      this.tables.set(table, new Map());
    }
    return this.tables.get(table)!;
  }

  async findById<T>(
    table: string,
    id: string,
    options?: { select?: string; tenantId?: string }
  ): Promise<SingleResult<T>> {
    const tableMap = this.tables.get(table);
    if (!tableMap) {
      return { data: null, error: null };
    }
    const record = tableMap.get(id);
    if (!record) {
      return { data: null, error: null };
    }
    if (options?.tenantId && record.tenant_id !== options.tenantId) {
      return { data: null, error: null };
    }
    return { data: { ...record } as unknown as T, error: null };
  }

  async findOne<T>(
    table: string,
    filters: FilterParams[],
    options?: { select?: string; tenantId?: string }
  ): Promise<SingleResult<T>> {
    const results = await this.findMany<T>(table, {
      filters,
      tenantId: options?.tenantId,
      pagination: { pageSize: 1 },
    });
    return {
      data: results.data && results.data.length > 0 ? results.data[0] : null,
      error: results.error,
    };
  }

  async findMany<T>(table: string, options?: QueryOptions): Promise<QueryResult<T>> {
    const tableMap = this.tables.get(table);
    if (!tableMap) {
      return { data: [], count: 0, error: null };
    }

    let records = Array.from(tableMap.values());

    // Apply tenantId if specified
    if (options?.tenantId) {
      records = records.filter((r) => r.tenant_id === options.tenantId);
    }

    // Apply companyId if specified
    if (options?.companyId) {
      records = records.filter((r) => r.company_id === options.companyId);
    }

    // Apply filters
    if (options?.filters && options.filters.length > 0) {
      records = records.filter((rec) => {
        return options.filters!.every((filter) => {
          const val = rec[filter.column];
          switch (filter.operator) {
            case 'eq':
              return val === filter.value;
            case 'neq':
              return val !== filter.value;
            case 'gt':
              return Number(val) > Number(filter.value);
            case 'gte':
              return String(val) >= String(filter.value);
            case 'lt':
              return Number(val) < Number(filter.value);
            case 'lte':
              return String(val) <= String(filter.value);
            case 'is':
              return filter.value === null ? val === null || val === undefined : val === filter.value;
            case 'in':
              return Array.isArray(filter.value) && filter.value.includes(val);
            default:
              return true;
          }
        });
      });
    }

    // Apply sort
    if (options?.sort && options.sort.length > 0) {
      records.sort((a, b) => {
        for (const s of options.sort!) {
          const aVal = a[s.column];
          const bVal = b[s.column];
          if (aVal === bVal) continue;
          if (aVal === undefined || aVal === null) return 1;
          if (bVal === undefined || bVal === null) return -1;
          const cmp = aVal < bVal ? -1 : 1;
          return s.direction === 'desc' ? -cmp : cmp;
        }
        return 0;
      });
    }

    const totalCount = records.length;

    // Apply pagination
    if (options?.pagination) {
      const page = options.pagination.page || 1;
      const pageSize = options.pagination.pageSize || 20;
      const start = (page - 1) * pageSize;
      records = records.slice(start, start + pageSize);
    }

    return {
      data: records.map((r) => ({ ...r } as unknown as T)),
      count: totalCount,
      error: null,
    };
  }

  async count(table: string, filters?: FilterParams[]): Promise<{ count: number | null; error: null }> {
    const res = await this.findMany(table, { filters });
    return { count: res.count, error: null };
  }

  async insert<T>(table: string, data: Record<string, unknown>): Promise<MutationResult<T>> {
    const tableMap = this.getOrCreateTable(table);
    const id = (data.id as string) || randomUUID();
    const record = {
      ...data,
      id,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
      version: data.version ?? 1,
    };
    tableMap.set(id, record);
    return { data: { ...record } as unknown as T, error: null };
  }

  async insertMany<T>(table: string, data: Record<string, unknown>[]): Promise<MutationResult<T[]>> {
    const inserted: T[] = [];
    for (const item of data) {
      const res = await this.insert<T>(table, item);
      if (res.data) inserted.push(res.data);
    }
    return { data: inserted, error: null };
  }

  async update<T>(
    table: string,
    id: string,
    data: Record<string, unknown>,
    options?: { expectedVersion?: number; tenantId?: string }
  ): Promise<MutationResult<T>> {
    const tableMap = this.getOrCreateTable(table);
    const existing = tableMap.get(id);
    if (!existing) {
      return { data: null, error: { code: 'NOT_FOUND', message: `Record ${id} not found` } };
    }
    if (options?.tenantId && existing.tenant_id !== options.tenantId) {
      return { data: null, error: { code: 'NOT_FOUND', message: 'Tenant mismatch' } };
    }
    if (options?.expectedVersion !== undefined && existing.version !== options.expectedVersion) {
      return { data: null, error: { code: 'CONCURRENCY_ERROR', message: 'Version conflict' } };
    }

    const updated = {
      ...existing,
      ...data,
      id,
      updated_at: new Date().toISOString(),
      version: (Number(existing.version) || 1) + 1,
    };
    tableMap.set(id, updated);
    return { data: { ...updated } as unknown as T, error: null };
  }

  async upsert<T>(table: string, data: Record<string, unknown>): Promise<MutationResult<T>> {
    const tableMap = this.getOrCreateTable(table);
    const id = (data.id as string) || randomUUID();
    const existing = tableMap.get(id);
    const record = {
      ...existing,
      ...data,
      id,
      updated_at: new Date().toISOString(),
    };
    tableMap.set(id, record);
    return { data: { ...record } as unknown as T, error: null };
  }

  async softDelete(
    table: string,
    id: string,
    deletedBy: string,
    options?: { tenantId?: string }
  ): Promise<{ error: null }> {
    const tableMap = this.getOrCreateTable(table);
    const existing = tableMap.get(id);
    if (existing) {
      if (!options?.tenantId || existing.tenant_id === options.tenantId) {
        existing.is_deleted = true;
        existing.deleted_by = deletedBy;
        existing.deleted_at = new Date().toISOString();
      }
    }
    return { error: null };
  }

  async hardDelete(table: string, id: string): Promise<{ error: null }> {
    const tableMap = this.getOrCreateTable(table);
    tableMap.delete(id);
    return { error: null };
  }

  async transaction<T>(fn: (tx: ITransactionClient) => Promise<T>): Promise<T> {
    const txClient: ITransactionClient = {
      insert: (table, data) => this.insert(table, data),
      insertMany: (table, data) => this.insertMany(table, data),
      update: (table, id, data) => this.update(table, id, data),
      softDelete: (table, id, deletedBy) =>
        this.softDelete(table, id, deletedBy).then(() => ({ data: null, error: null })),
      raw: (query, params) => this.raw(query, params),
    };
    return fn(txClient);
  }

  /**
   * Handle raw SQL queries used by NamingSeriesService and DocumentService.
   */
  async raw<T>(query: string, params?: unknown[]): Promise<QueryResult<T>> {
    const normalized = query.trim().replace(/\s+/g, ' ');

    // 1. Naming Series atomic UPSERT:
    // INSERT INTO naming_series (...) VALUES ($1, $2, $3, $4, $5, ...) ON CONFLICT (...) DO UPDATE SET current_value = naming_series.current_value + $6 ... RETURNING current_value;
    if (normalized.startsWith('INSERT INTO naming_series') && normalized.includes('DO UPDATE SET current_value = naming_series.current_value +')) {
      const [tenantId, companyId, seriesKey, step] = params as [string, string, string, number, string, number];
      const key = `${tenantId}:${companyId}:${seriesKey}`;
      const current = this.namingSeriesCounters.get(key) || 0;
      const next = current + (step || 1);
      this.namingSeriesCounters.set(key, next);

      return {
        data: [{ current_value: next }] as unknown as T[],
        count: 1,
        error: null,
      };
    }

    // 2. Naming Series set counter:
    // INSERT INTO naming_series ... DO UPDATE SET current_value = $4
    if (normalized.startsWith('INSERT INTO naming_series') && normalized.includes('DO UPDATE SET current_value = $4')) {
      const [tenantId, companyId, seriesKey, value] = params as [string, string, string, number];
      const key = `${tenantId}:${companyId}:${seriesKey}`;
      this.namingSeriesCounters.set(key, value);
      return { data: [{ current_value: value }] as unknown as T[], count: 1, error: null };
    }

    // 3. Naming Series preview:
    // SELECT current_value FROM naming_series WHERE tenant_id = $1 AND company_id = $2 AND series_key = $3
    if (normalized.startsWith('SELECT current_value FROM naming_series')) {
      const [tenantId, companyId, seriesKey] = params as [string, string, string];
      const key = `${tenantId}:${companyId}:${seriesKey}`;
      const current = this.namingSeriesCounters.get(key) || 0;
      return {
        data: current > 0 ? ([{ current_value: current }] as unknown as T[]) : [],
        count: current > 0 ? 1 : 0,
        error: null,
      };
    }

    // 4. Document Service optimistic update:
    // UPDATE tableName SET col1 = $1, ... WHERE id = $X AND version = $Y AND tenant_id = $Z RETURNING *
    const updateMatch = normalized.match(/UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+(.+?)\s+WHERE\s+(.+?)\s+RETURNING \*/i);
    if (updateMatch) {
      const tableName = updateMatch[1];
      const tableMap = this.getOrCreateTable(tableName);

      // Extract id, expectedVersion, tenantId from params
      // The params are: [val1, val2, ..., id, expectedVersion, tenantId]
      const tenantId = params![params!.length - 1] as string;
      const expectedVersion = params![params!.length - 2] as number;
      const id = params![params!.length - 3] as string;

      const existing = tableMap.get(id);
      if (!existing || existing.tenant_id !== tenantId || existing.version !== expectedVersion) {
        // Concurrency conflict or not found
        return { data: [], count: 0, error: null };
      }

      // Parse column assignments: col1 = $1, col2 = $2, ...
      const setClause = updateMatch[2];
      const assignments = setClause.split(',').map((s) => s.trim());
      const updatedRecord = { ...existing };

      for (let i = 0; i < assignments.length; i++) {
        const colName = assignments[i].split('=')[0].trim();
        updatedRecord[colName] = params![i];
      }

      tableMap.set(id, updatedRecord);
      return {
        data: [{ ...updatedRecord }] as unknown as T[],
        count: 1,
        error: null,
      };
    }

    // 5. Child items delete:
    // DELETE FROM ${itemTable} WHERE parent_id = $1 AND parent_doctype = $2
    const deleteMatch = normalized.match(/DELETE FROM\s+([a-zA-Z0-9_]+)\s+WHERE parent_id = \$1 AND parent_doctype = \$2/i);
    if (deleteMatch) {
      const tableName = deleteMatch[1];
      const tableMap = this.getOrCreateTable(tableName);
      const [parentId, parentDoctype] = params as [string, string];
      for (const [rowId, row] of tableMap.entries()) {
        if (row.parent_id === parentId && row.parent_doctype === parentDoctype) {
          tableMap.delete(rowId);
        }
      }
      return { data: [], count: 0, error: null };
    }

    return { data: [], count: 0, error: null };
  }
}
