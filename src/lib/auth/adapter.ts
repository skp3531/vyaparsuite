export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  phone?: string;
  createdAt: string;
  lastSignInAt?: string;
  appMetadata?: Record<string, unknown>;
  userMetadata?: Record<string, unknown>;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
}

export interface IAuthAdapter {
  // Session management
  getSession(): Promise<AuthSession | null>;
  getUser(): Promise<AuthUser | null>;
  
  // Authentication
  signInWithEmail(email: string, password: string): Promise<{ session: AuthSession | null; error: AuthError | null }>;
  signUp(email: string, password: string, metadata?: Record<string, unknown>): Promise<{ user: AuthUser | null; error: AuthError | null }>;
  signOut(): Promise<{ error: AuthError | null }>;
  resetPassword(email: string): Promise<{ error: AuthError | null }>;
  updatePassword(newPassword: string): Promise<{ error: AuthError | null }>;
  
  // Token management
  refreshSession(): Promise<{ session: AuthSession | null; error: AuthError | null }>;
  
  // Admin operations (server-side only)
  adminGetUser(userId: string): Promise<{ user: AuthUser | null; error: AuthError | null }>;
  adminCreateUser(email: string, password: string, metadata?: Record<string, unknown>): Promise<{ user: AuthUser | null; error: AuthError | null }>;
  adminDeleteUser(userId: string): Promise<{ error: AuthError | null }>;
  adminUpdateUser(userId: string, attributes: Partial<AuthUser>): Promise<{ user: AuthUser | null; error: AuthError | null }>;
}

export interface AuthError {
  code: string;
  message: string;
  status?: number;
}
