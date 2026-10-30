import { cookies } from 'next/headers';
import type { ERPSession, CompanyOption, BranchOption } from '../types/session';

export const SESSION_COOKIE_NAME = 'vyapar_session_data';
export const AUTH_TOKEN_COOKIE = 'vyapar_auth_token';

// Seed default company & branch registry for multi-entity support
const DEFAULT_COMPANIES: CompanyOption[] = [
  {
    id: 'comp-001',
    name: 'VyaparSuite Technologies Pvt Ltd',
    code: 'VST-HQ',
    currency: 'INR',
    gstin: '27AABCV1234F1Z5',
    isDefault: true,
  },
  {
    id: 'comp-002',
    name: 'Vyapar Retail Ventures LLP',
    code: 'VRV-DEL',
    currency: 'INR',
    gstin: '07AABCV5678F1Z2',
    isDefault: false,
  },
  {
    id: 'comp-003',
    name: 'Vyapar Global FZE',
    code: 'VGF-DXB',
    currency: 'AED',
    isDefault: false,
  },
];

const DEFAULT_BRANCHES: Record<string, BranchOption[]> = {
  'comp-001': [
    { id: 'br-001', name: 'Corporate HQ - Mumbai', code: 'MUM-HQ', companyId: 'comp-001' },
    { id: 'br-002', name: 'Manufacturing Plant - Pune', code: 'PUN-MFG', companyId: 'comp-001' },
    { id: 'br-003', name: 'Central Warehouse - Bhiwandi', code: 'BHW-WH', companyId: 'comp-001' },
  ],
  'comp-002': [
    { id: 'br-004', name: 'Retail Store - Connaught Place', code: 'DEL-CP', companyId: 'comp-002' },
    { id: 'br-005', name: 'Distribution Depot - Noida', code: 'NOI-DEP', companyId: 'comp-002' },
  ],
  'comp-003': [
    { id: 'br-006', name: 'Dubai Marina Regional Hub', code: 'DXB-HUB', companyId: 'comp-003' },
  ],
};

const DEFAULT_FINANCIAL_YEARS = ['2024-2025', '2023-2024', '2022-2023'];

/**
 * Retrieves the current authenticated ERP session.
 * Reads cookies from next/headers.
 * Returns null if unauthenticated.
 */
export async function getServerSession(): Promise<ERPSession | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  const tokenCookie = cookieStore.get(AUTH_TOKEN_COOKIE);

  // If no auth token and no session cookie, user is not logged in
  if (!sessionCookie && !tokenCookie) {
    return null;
  }

  let sessionData: Partial<ERPSession> = {};
  if (sessionCookie?.value) {
    try {
      sessionData = JSON.parse(decodeURIComponent(sessionCookie.value));
    } catch {
      sessionData = {};
    }
  }

  const selectedCompanyId = sessionData.companyId || 'comp-001';
  const currentCompany =
    DEFAULT_COMPANIES.find((c) => c.id === selectedCompanyId) || DEFAULT_COMPANIES[0];

  const availableBranches = DEFAULT_BRANCHES[currentCompany.id] || DEFAULT_BRANCHES['comp-001'];
  const selectedBranchId = sessionData.branch?.id || availableBranches[0].id;
  const currentBranch =
    availableBranches.find((b) => b.id === selectedBranchId) || availableBranches[0];

  const financialYear = sessionData.financialYear || '2024-2025';

  const user = sessionData.user || {
    id: 'usr-admin-01',
    email: 'admin@vyaparsuite.com',
    name: 'Sanjay Kumar Panda',
    role: 'System Administrator',
    initials: 'SK',
  };

  return {
    user: {
      ...user,
      initials:
        user.name
          ?.split(' ')
          .map((n: string) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || 'VS',
    },
    tenantId: sessionData.tenantId || 'tenant-vyapar-main',
    companyId: currentCompany.id,
    company: currentCompany,
    companies: DEFAULT_COMPANIES,
    branch: currentBranch,
    branches: availableBranches,
    financialYear,
    financialYears: DEFAULT_FINANCIAL_YEARS,
  };
}

/**
 * Creates or updates an authenticated session cookie.
 */
export async function setServerSessionCookie(session: ERPSession): Promise<void> {
  const cookieStore = cookies();
  cookieStore.set(AUTH_TOKEN_COOKIE, 'token_' + Date.now(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  cookieStore.set(SESSION_COOKIE_NAME, encodeURIComponent(JSON.stringify(session)), {
    httpOnly: false, // Accessible to client components for instant optimistic state
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

/**
 * Clears the authenticated session cookies.
 */
export async function clearServerSessionCookie(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(AUTH_TOKEN_COOKIE);
  cookieStore.delete(SESSION_COOKIE_NAME);
}
