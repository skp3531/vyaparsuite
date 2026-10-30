import type { SupabaseClient, User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/db/client';
import type {
  AuthError,
  AuthSession,
  AuthUser,
  IAuthAdapter,
} from './adapter';

export class SupabaseAuthAdapter implements IAuthAdapter {
  private client: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.client = client || createServerClient();
  }

  private mapUser(user: SupabaseUser): AuthUser {
    return {
      id: user.id,
      email: user.email || '',
      emailVerified: Boolean(user.email_confirmed_at),
      phone: user.phone || undefined,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at || undefined,
      appMetadata: user.app_metadata,
      userMetadata: user.user_metadata,
    };
  }

  private mapSession(session: SupabaseSession): AuthSession {
    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at ?? 0,
      user: this.mapUser(session.user),
    };
  }

  private formatError(error: unknown): AuthError {
    if (!error) {
      return {
        code: 'AUTH_ERROR',
        message: 'An unknown authentication error occurred',
      };
    }

    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;
      return {
        code: String(err.name || err.code || 'AUTH_ERROR'),
        message: String(err.message || 'Authentication operation failed'),
        status: typeof err.status === 'number' ? err.status : undefined,
      };
    }

    return {
      code: 'AUTH_ERROR',
      message: String(error),
    };
  }

  // ==========================================
  // Session Management
  // ==========================================

  async getSession(): Promise<AuthSession | null> {
    try {
      const { data, error } = await this.client.auth.getSession();
      if (error || !data.session) {
        return null;
      }
      return this.mapSession(data.session);
    } catch {
      return null;
    }
  }

  async getUser(): Promise<AuthUser | null> {
    try {
      const { data, error } = await this.client.auth.getUser();
      if (error || !data.user) {
        return null;
      }
      return this.mapUser(data.user);
    } catch {
      return null;
    }
  }

  // ==========================================
  // Authentication
  // ==========================================

  async signInWithEmail(
    email: string,
    password: string
  ): Promise<{ session: AuthSession | null; error: AuthError | null }> {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { session: null, error: this.formatError(error) };
      }

      return {
        session: data.session ? this.mapSession(data.session) : null,
        error: null,
      };
    } catch (err) {
      return { session: null, error: this.formatError(err) };
    }
  }

  async signUp(
    email: string,
    password: string,
    metadata?: Record<string, unknown>
  ): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        return { user: null, error: this.formatError(error) };
      }

      return {
        user: data.user ? this.mapUser(data.user) : null,
        error: null,
      };
    } catch (err) {
      return { user: null, error: this.formatError(err) };
    }
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.client.auth.signOut();
      if (error) {
        return { error: this.formatError(error) };
      }
      return { error: null };
    } catch (err) {
      return { error: this.formatError(err) };
    }
  }

  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.client.auth.resetPasswordForEmail(email);
      if (error) {
        return { error: this.formatError(error) };
      }
      return { error: null };
    } catch (err) {
      return { error: this.formatError(err) };
    }
  }

  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.client.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        return { error: this.formatError(error) };
      }
      return { error: null };
    } catch (err) {
      return { error: this.formatError(err) };
    }
  }

  // ==========================================
  // Token Management
  // ==========================================

  async refreshSession(): Promise<{ session: AuthSession | null; error: AuthError | null }> {
    try {
      const { data, error } = await this.client.auth.refreshSession();
      if (error) {
        return { session: null, error: this.formatError(error) };
      }
      return {
        session: data.session ? this.mapSession(data.session) : null,
        error: null,
      };
    } catch (err) {
      return { session: null, error: this.formatError(err) };
    }
  }

  // ==========================================
  // Admin Operations (Server-side Only)
  // ==========================================

  async adminGetUser(userId: string): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await this.client.auth.admin.getUserById(userId);
      if (error) {
        return { user: null, error: this.formatError(error) };
      }
      return {
        user: data.user ? this.mapUser(data.user) : null,
        error: null,
      };
    } catch (err) {
      return { user: null, error: this.formatError(err) };
    }
  }

  async adminCreateUser(
    email: string,
    password: string,
    metadata?: Record<string, unknown>
  ): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await this.client.auth.admin.createUser({
        email,
        password,
        user_metadata: metadata,
        email_confirm: true,
      });

      if (error) {
        return { user: null, error: this.formatError(error) };
      }

      return {
        user: data.user ? this.mapUser(data.user) : null,
        error: null,
      };
    } catch (err) {
      return { user: null, error: this.formatError(err) };
    }
  }

  async adminDeleteUser(userId: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.client.auth.admin.deleteUser(userId);
      if (error) {
        return { error: this.formatError(error) };
      }
      return { error: null };
    } catch (err) {
      return { error: this.formatError(err) };
    }
  }

  async adminUpdateUser(
    userId: string,
    attributes: Partial<AuthUser>
  ): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateAttrs: Record<string, any> = {};
      if (attributes.email !== undefined) updateAttrs.email = attributes.email;
      if (attributes.emailVerified !== undefined) updateAttrs.email_confirm = attributes.emailVerified;
      if (attributes.phone !== undefined) updateAttrs.phone = attributes.phone;
      if (attributes.userMetadata !== undefined) updateAttrs.user_metadata = attributes.userMetadata;
      if (attributes.appMetadata !== undefined) updateAttrs.app_metadata = attributes.appMetadata;

      const { data, error } = await this.client.auth.admin.updateUserById(userId, updateAttrs);

      if (error) {
        return { user: null, error: this.formatError(error) };
      }

      return {
        user: data.user ? this.mapUser(data.user) : null,
        error: null,
      };
    } catch (err) {
      return { user: null, error: this.formatError(err) };
    }
  }
}

export function createAuthAdapter(client?: SupabaseClient): IAuthAdapter {
  return new SupabaseAuthAdapter(client);
}
