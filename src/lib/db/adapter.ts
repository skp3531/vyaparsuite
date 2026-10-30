/**
 * VyaparSuite Database Adapter Interface
 * Decouples business logic from specific PostgreSQL or Supabase client implementations.
 * Standardizes types across single records, collections, mutations, and transactions.
 */

export interface DatabaseError {
  code: string;
  message: string;
  details?: string;
  hint?: string;
}

export type QueryOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'is'
  | 'like'
  | 'ilike'
  | 'contains'
  | 'containedBy';

export interface FilterParams {
  column: string;
  operator: QueryOperator;
  value: unknown;
}
export type QueryFilter = FilterParams;

export interface SortParams {
  column: string;
  direction: 'asc' | 'desc';
}
export type QuerySort = SortParams;

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  cursorColumn?: string;
}
export type PaginationOptions = PaginationParams;

export interface QueryOptions {
  filters?: FilterParams[];
  sort?: SortParams[];
  pagination?: PaginationParams;
  select?: string;
  tenantId?: string;
  companyId?: string;
}

export interface QueryResult<T> {
  data: T[] | null;
  count: number | null;
  error: DatabaseError | null;
}
export type DbListResult<T> = QueryResult<T>;

export interface SingleResult<T> {
  data: T | null;
  error: DatabaseError | null;
}
export type DbResult<T> = SingleResult<T>;

export type MutationResult<T> = SingleResult<T>;

export interface ITransactionClient {
  insert<T>(table: string, data: Record<string, unknown>): Promise<MutationResult<T>>;
  insertMany<T>(table: string, data: Record<string, unknown>[]): Promise<MutationResult<T[]>>;
  update<T>(table: string, id: string, data: Record<string, unknown>): Promise<MutationResult<T>>;
  softDelete(table: string, id: string, deletedBy: string): Promise<MutationResult<null>>;
  raw<T>(query: string, params?: unknown[]): Promise<QueryResult<T>>;
}

export interface IDatabaseAdapter {
  findMany<T>(table: string, options?: QueryOptions): Promise<QueryResult<T>>;
  
  findById<T>(
    table: string,
    id: string,
    options?: { select?: string; tenantId?: string }
  ): Promise<SingleResult<T>>;
  
  findOne<T>(
    table: string,
    filters: FilterParams[],
    options?: { select?: string; tenantId?: string }
  ): Promise<SingleResult<T>>;
  
  count(table: string, filters?: FilterParams[]): Promise<{ count: number | null; error: DatabaseError | null }>;
  
  insert<T>(table: string, data: Record<string, unknown>): Promise<MutationResult<T>>;
  
  insertMany<T>(table: string, data: Record<string, unknown>[]): Promise<MutationResult<T[]>>;
  
  update<T>(
    table: string,
    id: string,
    data: Record<string, unknown>,
    options?: { expectedVersion?: number; tenantId?: string }
  ): Promise<MutationResult<T>>;
  
  upsert<T>(table: string, data: Record<string, unknown>, onConflict: string): Promise<MutationResult<T>>;
  
  softDelete(
    table: string,
    id: string,
    deletedBy: string,
    options?: { tenantId?: string }
  ): Promise<{ error: DatabaseError | null }>;
  
  hardDelete(table: string, id: string): Promise<{ error: DatabaseError | null }>;
  
  transaction<T>(fn: (tx: ITransactionClient) => Promise<T>): Promise<T>;
  
  raw<T>(query: string, params?: unknown[]): Promise<QueryResult<T>>;
}
