import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/db/client';
import type {
  IStorageAdapter,
  StorageError,
  StorageFile,
} from './adapter';

export class SupabaseStorageAdapter implements IStorageAdapter {
  private client: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.client = client || createServerClient();
  }

  private formatError(error: unknown): StorageError {
    if (!error) {
      return {
        code: 'STORAGE_ERROR',
        message: 'An unknown storage error occurred',
      };
    }

    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;
      return {
        code: String(err.statusCode || err.error || err.name || 'STORAGE_ERROR'),
        message: String(err.message || 'Storage operation failed'),
      };
    }

    return {
      code: 'STORAGE_ERROR',
      message: String(error),
    };
  }

  async upload(
    bucket: string,
    path: string,
    file: File | Buffer,
    options?: { contentType?: string; upsert?: boolean }
  ): Promise<{ data: StorageFile | null; error: StorageError | null }> {
    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .upload(path, file, {
          contentType: options?.contentType,
          upsert: options?.upsert ?? false,
        });

      if (error) {
        return { data: null, error: this.formatError(error) };
      }

      const fileName = path.split('/').pop() || path;
      const size = Buffer.isBuffer(file) ? file.length : (file as File).size ?? 0;
      const mimeType = options?.contentType || (file as File).type || 'application/octet-stream';

      const storageFile: StorageFile = {
        id: data.id || data.path,
        name: fileName,
        bucket,
        path: data.path,
        size,
        mimeType,
        url: this.getPublicUrl(bucket, data.path),
        createdAt: new Date().toISOString(),
      };

      return { data: storageFile, error: null };
    } catch (err) {
      return { data: null, error: this.formatError(err) };
    }
  }

  async download(bucket: string, path: string): Promise<{ data: Blob | null; error: StorageError | null }> {
    try {
      const { data, error } = await this.client.storage.from(bucket).download(path);

      if (error) {
        return { data: null, error: this.formatError(error) };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: this.formatError(err) };
    }
  }

  getPublicUrl(bucket: string, path: string): string {
    const { data } = this.client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async getSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number
  ): Promise<{ url: string | null; error: StorageError | null }> {
    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        return { url: null, error: this.formatError(error) };
      }

      return { url: data?.signedUrl ?? null, error: null };
    } catch (err) {
      return { url: null, error: this.formatError(err) };
    }
  }

  async delete(bucket: string, paths: string[]): Promise<{ error: StorageError | null }> {
    try {
      const { error } = await this.client.storage.from(bucket).remove(paths);
      if (error) {
        return { error: this.formatError(error) };
      }
      return { error: null };
    } catch (err) {
      return { error: this.formatError(err) };
    }
  }

  async list(
    bucket: string,
    path?: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ data: StorageFile[] | null; error: StorageError | null }> {
    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .list(path || '', {
          limit: options?.limit,
          offset: options?.offset,
        });

      if (error) {
        return { data: null, error: this.formatError(error) };
      }

      const files: StorageFile[] = (data || []).map((item) => {
        const itemPath = path ? `${path}/${item.name}` : item.name;
        const itemMetadata = item.metadata as Record<string, unknown> | undefined;
        return {
          id: item.id || itemPath,
          name: item.name,
          bucket,
          path: itemPath,
          size: typeof itemMetadata?.size === 'number' ? itemMetadata.size : 0,
          mimeType: typeof itemMetadata?.mimetype === 'string' ? itemMetadata.mimetype : 'application/octet-stream',
          url: this.getPublicUrl(bucket, itemPath),
          createdAt: item.created_at || new Date().toISOString(),
        };
      });

      return { data: files, error: null };
    } catch (err) {
      return { data: null, error: this.formatError(err) };
    }
  }

  async move(bucket: string, fromPath: string, toPath: string): Promise<{ error: StorageError | null }> {
    try {
      const { error } = await this.client.storage.from(bucket).move(fromPath, toPath);
      if (error) {
        return { error: this.formatError(error) };
      }
      return { error: null };
    } catch (err) {
      return { error: this.formatError(err) };
    }
  }

  async copy(bucket: string, fromPath: string, toPath: string): Promise<{ error: StorageError | null }> {
    try {
      const { error } = await this.client.storage.from(bucket).copy(fromPath, toPath);
      if (error) {
        return { error: this.formatError(error) };
      }
      return { error: null };
    } catch (err) {
      return { error: this.formatError(err) };
    }
  }
}

export function createStorageAdapter(client?: SupabaseClient): IStorageAdapter {
  return new SupabaseStorageAdapter(client);
}
