export interface StorageFile {
  id: string;
  name: string;
  bucket: string;
  path: string;
  size: number;
  mimeType: string;
  url: string;
  createdAt: string;
}

export interface IStorageAdapter {
  upload(
    bucket: string,
    path: string,
    file: File | Buffer,
    options?: { contentType?: string; upsert?: boolean }
  ): Promise<{ data: StorageFile | null; error: StorageError | null }>;
  download(bucket: string, path: string): Promise<{ data: Blob | null; error: StorageError | null }>;
  getPublicUrl(bucket: string, path: string): string;
  getSignedUrl(bucket: string, path: string, expiresIn: number): Promise<{ url: string | null; error: StorageError | null }>;
  delete(bucket: string, paths: string[]): Promise<{ error: StorageError | null }>;
  list(
    bucket: string,
    path?: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ data: StorageFile[] | null; error: StorageError | null }>;
  move(bucket: string, fromPath: string, toPath: string): Promise<{ error: StorageError | null }>;
  copy(bucket: string, fromPath: string, toPath: string): Promise<{ error: StorageError | null }>;
}

export interface StorageError {
  code: string;
  message: string;
}
