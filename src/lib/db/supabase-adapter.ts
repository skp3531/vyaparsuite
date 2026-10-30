import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from './client';
import type {
  DatabaseError,
  FilterParams,
  IDatabaseAdapter,
  ITransactionClient,
  MutationResult,
  QueryOptions,
  QueryResult,
  SingleResult,
} from './adapter';

export class SupabaseDatabaseAdapter implements IDatabaseAdapter {
  private client: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.client = client || createServerClient();
  }

  /**
   * Helper to format Postgrest or runtime errors into DatabaseError
   */
  private mapError(error: unknown): DatabaseError {
    if (!error) {
      return {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown database error occurred',
      };
    }

    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;
      return {
        code: String(err.code || 'DATABASE_ERROR'),
        message: String(err.message || 'Database operation failed'),
        details: err.details ? String(err.details) : undefined,
        hint: err.hint ? String(err.hint) : undefined,
      };
    }

    return {
      code: 'DATABASE_ERROR',
      message: String(error),
    };
  }

  /**
   * Helper to apply FilterParams array onto a Supabase query builder
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private applyFilters(query: any, filters: FilterParams[]): any {
    let q = query;
    for (const filter of filters) {
      const { column, operator, value } = filter;
      switch (operator) {
        case 'eq':
          q = q.eq(column, value);
          break;
        case 'neq':
          q = q.neq(column, value);
          break;
        case 'gt':
          q = q.gt(column, value);
          break;
        case 'gte':
          q = q.gte(column, value);
          break;
        case 'lt':
          q = q.lt(column, value);
          break;
        case 'lte':
          q = q.lte(column, value);
          break;
        case 'like':
          q = q.like(column, String(value));
          break;
        case 'ilike':
          q = q.ilike(column, String(value));
          break;
        case 'in':
          q = q.in(column, Array.isArray(value) ? value : [value]);
          break;
        case 'is':
          q = q.is(column, value as null | boolean);
          break;
        case 'contains':
          q = q.contains(column, value);
          break;
        case 'containedBy':
          q = q.containedBy(column, value);
          break;
        default:
          q = q.eq(column, value);
          break;
      }
    }
    return q;
  }

  // ==========================================
  // Query Operations
  // ==========================================

  async findMany<T>(table: string, options?: QueryOptions): Promise<QueryResult<T>> {
    try {
      const selectClause = options?.select || '*';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = this.client
        .from(table)
        .select(selectClause, { count: 'exact' });

      // Multi-tenant and company isolation
      if (options?.tenantId) {
        query = query.eq('tenant_id', options.tenantId);
      }
      if (options?.companyId) {
        query = query.eq('company_id', options.companyId);
      }

      // Filter conditions
      if (options?.filters && options.filters.length > 0) {
        query = this.applyFilters(query, options.filters);
      }

      // Sorting
      if (options?.sort && options.sort.length > 0) {
        for (const s of options.sort) {
          query = query.order(s.column, { ascending: s.direction === 'asc' });
        }
      }

      // Pagination
      if (options?.pagination) {
        const { page, pageSize, cursor, cursorColumn } = options.pagination;
        if (cursor && cursorColumn) {
          query = query.gt(cursorColumn, cursor);
          if (pageSize) {
            query = query.limit(pageSize);
          }
        } else if (page !== undefined && pageSize !== undefined) {
          const from = Math.max(0, (page - 1) * pageSize);
          const to = from + pageSize - 1;
          query = query.range(from, to);
        } else if (pageSize !== undefined) {
          query = query.limit(pageSize);
        }
      }

      const { data, error, count } = await query;

      if (error) {
        return {
          data: null,
          error: this.mapError(error),
          count: null,
        };
      }

      return {
        data: (data as unknown as T[]) ?? [],
        error: null,
        count: count ?? null,
      };
    } catch (err) {
      return {
        data: null,
        error: this.mapError(err),
        count: null,
      };
    }
  }

  async findById<T>(
    table: string,
    id: string,
    options?: Pick<QueryOptions, 'select' | 'tenantId'>
  ): Promise<SingleResult<T>> {
    try {
      const selectClause = options?.select || '*';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = this.client.from(table).select(selectClause).eq('id', id);

      if (options?.tenantId) {
        query = query.eq('tenant_id', options.tenantId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        return { data: null, error: this.mapError(error) };
      }

      return { data: (data as unknown as T) ?? null, error: null };
    } catch (err) {
      return { data: null, error: this.mapError(err) };
    }
  }

  async findOne<T>(
    table: string,
    filters: FilterParams[],
    options?: Pick<QueryOptions, 'select' | 'tenantId'>
  ): Promise<SingleResult<T>> {
    try {
      const selectClause = options?.select || '*';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = this.client.from(table).select(selectClause);

      if (options?.tenantId) {
        query = query.eq('tenant_id', options.tenantId);
      }

      if (filters.length > 0) {
        query = this.applyFilters(query, filters);
      }

      const { data, error } = await query.limit(1).maybeSingle();

      if (error) {
        return { data: null, error: this.mapError(error) };
      }

      return { data: (data as unknown as T) ?? null, error: null };
    } catch (err) {
      return { data: null, error: this.mapError(err) };
    }
  }

  async count(
    table: string,
    filters?: FilterParams[]
  ): Promise<{ count: number | null; error: DatabaseError | null }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = this.client.from(table).select('*', { count: 'exact', head: true });

      if (filters && filters.length > 0) {
        query = this.applyFilters(query, filters);
      }

      const { count, error } = await query;

      if (error) {
        return { count: null, error: this.mapError(error) };
      }

      return { count: count ?? 0, error: null };
    } catch (err) {
      return { count: null, error: this.mapError(err) };
    }
  }

  // ==========================================
  // Mutation Operations
  // ==========================================

  async insert<T>(table: string, data: Record<string, unknown>): Promise<MutationResult<T>> {
    try {
      const { data: result, error } = await this.client
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        return { data: null, error: this.mapError(error) };
      }

      return { data: (result as unknown as T) ?? null, error: null };
    } catch (err) {
      return { data: null, error: this.mapError(err) };
    }
  }

  async insertMany<T>(table: string, data: Record<string, unknown>[]): Promise<MutationResult<T[]>> {
    try {
      const { data: result, error } = await this.client
        .from(table)
        .insert(data)
        .select();

      if (error) {
        return { data: null, error: this.mapError(error) };
      }

      return { data: (result as unknown as T[]) ?? null, error: null };
    } catch (err) {
      return { data: null, error: this.mapError(err) };
    }
  }

  async update<T>(table: string, id: string, data: Record<string, unknown>): Promise<MutationResult<T>> {
    try {
      const payload: Record<string, unknown> = {
        ...data,
        updated_at: data.updated_at || new Date().toISOString(),
      };

      const { data: result, error } = await this.client
        .from(table)
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error: this.mapError(error) };
      }

      return { data: (result as unknown as T) ?? null, error: null };
    } catch (err) {
      return { data: null, error: this.mapError(err) };
    }
  }

  async upsert<T>(
    table: string,
    data: Record<string, unknown>,
    onConflict: string
  ): Promise<MutationResult<T>> {
    try {
      const payload: Record<string, unknown> = {
        ...data,
        updated_at: data.updated_at || new Date().toISOString(),
      };

      const { data: result, error } = await this.client
        .from(table)
        .upsert(payload, { onConflict })
        .select()
        .single();

      if (error) {
        return { data: null, error: this.mapError(error) };
      }

      return { data: (result as unknown as T) ?? null, error: null };
    } catch (err) {
      return { data: null, error: this.mapError(err) };
    }
  }

  async softDelete(table: string, id: string, deletedBy: string): Promise<MutationResult<null>> {
    try {
      const now = new Date().toISOString();
      const { error } = await this.client
        .from(table)
        .update({
          is_deleted: true,
          deleted_at: now,
          deleted_by: deletedBy,
          updated_at: now,
        })
        .eq('id', id);

      if (error) {
        return { data: null, error: this.mapError(error) };
      }

      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: this.mapError(err) };
    }
  }

  async hardDelete(table: string, id: string): Promise<MutationResult<null>> {
    try {
      const { error } = await this.client.from(table).delete().eq('id', id);

      if (error) {
        return { data: null, error: this.mapError(error) };
      }

      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: this.mapError(err) };
    }
  }

  // ==========================================
  // Transaction Support
  // ==========================================

  async transaction<T>(fn: (tx: ITransactionClient) => Promise<T>): Promise<T> {
    const txClient = new SupabaseTransactionClient(this.client, this.mapError.bind(this));
    return await fn(txClient);
  }

  // ==========================================
  // Raw Query (Escape Hatch)
  // ==========================================

  async raw<T>(query: string, params?: unknown[]): Promise<QueryResult<T>> {
    try {
      const { data, error } = await this.client.rpc('exec_sql', {
        sql: query,
        params: params || [],
      });

      if (error) {
        return {
          data: null,
          error: this.mapError(error),
          count: null,
        };
      }

      const rows = (data as unknown as T[]) ?? [];
      return {
        data: rows,
        error: null,
        count: rows.length,
      };
    } catch (err) {
      return {
        data: null,
        error: this.mapError(err),
        count: null,
      };
    }
  }
}

/**
 * Transaction client implementation over Supabase
 */
class SupabaseTransactionClient implements ITransactionClient {
  constructor(
    private client: SupabaseClient,
    private mapError: (error: unknown) => DatabaseError
  ) {}

  async insert<T>(table: string, data: Record<string, unknown>): Promise<MutationResult<T>> {
    try {
      const { data: result, error } = await this.client
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        return { data: null, error: this.mapError(error) };
      }

      return { data: (result as unknown as T) ?? null, error: null };
    } catch (err) {
      return { data: null, error: this.mapError(err) };
    }
  }

  async insertMany<T>(table: string, data: Record<string, unknown>[]): Promise<MutationResult<T[]>> {
    try {
      const { data: result, error } = await this.client
        .from(table)
        .insert(data)
        .select();

      if (error) {
        return { data: null, error: this.mapError(error) };
      }

      return { data: (result as unknown as T[]) ?? null, error: null };
    } catch (err) {
      return { data: null, error: this.mapError(err) };
    }
  }

  async update<T>(table: string, id: string, data: Record<string, unknown>): Promise<MutationResult<T>> {
    try {
      const payload: Record<string, unknown> = {
        ...data,
        updated_at: data.updated_at || new Date().toISOString(),
      };

      const { data: result, error } = await this.client
        .from(table)
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error: this.mapError(error) };
      }

      return { data: (result as unknown as T) ?? null, error: null };
    } catch (err) {
      return { data: null, error: this.mapError(err) };
    }
  }

  async softDelete(table: string, id: string, deletedBy: string): Promise<MutationResult<null>> {
    try {
      const now = new Date().toISOString();
      const { error } = await this.client
        .from(table)
        .update({
          is_deleted: true,
          deleted_at: now,
          deleted_by: deletedBy,
          updated_at: now,
        })
        .eq('id', id);

      if (error) {
        return { data: null, error: this.mapError(error) };
      }

      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: this.mapError(err) };
    }
  }

  async raw<T>(query: string, params?: unknown[]): Promise<QueryResult<T>> {
    try {
      const { data, error } = await this.client.rpc('exec_sql', {
        sql: query,
        params: params || [],
      });

      if (error) {
        return {
          data: null,
          error: this.mapError(error),
          count: null,
        };
      }

      const rows = (data as unknown as T[]) ?? [];
      return {
        data: rows,
        error: null,
        count: rows.length,
      };
    } catch (err) {
      return {
        data: null,
        error: this.mapError(err),
        count: null,
      };
    }
  }
}

export function createSupabaseAdapter(client?: SupabaseClient): IDatabaseAdapter {
  return new SupabaseDatabaseAdapter(client);
}
