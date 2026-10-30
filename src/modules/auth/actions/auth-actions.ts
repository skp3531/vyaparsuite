'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  setServerSessionCookie,
  clearServerSessionCookie,
  getServerSession,
  SESSION_COOKIE_NAME,
} from '../services/session';
import type { ERPSession } from '../types/session';
import { cookies } from 'next/headers';

/**
 * Authenticates user credentials or signs in with demo credentials.
 */
export async function loginAction(formData: FormData) {
  const email = (formData.get('email') as string) || '';
  const password = (formData.get('password') as string) || '';

  // Minimal validation
  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  // Set default authenticated session
  const defaultSession: ERPSession = {
    user: {
      id: 'usr-admin-01',
      email,
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      role: 'System Administrator',
      initials: 'SA',
    },
    tenantId: 'tenant-vyapar-main',
    companyId: 'comp-001',
    company: {
      id: 'comp-001',
      name: 'VyaparSuite Technologies Pvt Ltd',
      code: 'VST-HQ',
      currency: 'INR',
      gstin: '27AABCV1234F1Z5',
      isDefault: true,
    },
    companies: [
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
    ],
    branch: {
      id: 'br-001',
      name: 'Corporate HQ - Mumbai',
      code: 'MUM-HQ',
      companyId: 'comp-001',
    },
    branches: [
      { id: 'br-001', name: 'Corporate HQ - Mumbai', code: 'MUM-HQ', companyId: 'comp-001' },
      { id: 'br-002', name: 'Manufacturing Plant - Pune', code: 'PUN-MFG', companyId: 'comp-001' },
      { id: 'br-003', name: 'Central Warehouse - Bhiwandi', code: 'BHW-WH', companyId: 'comp-001' },
    ],
    financialYear: '2024-2025',
    financialYears: ['2024-2025', '2023-2024', '2022-2023'],
  };

  await setServerSessionCookie(defaultSession);
  return { success: true };
}

/**
 * Fast demo login for immediate development testing
 */
export async function demoLoginAction() {
  const demoSession: ERPSession = {
    user: {
      id: 'usr-admin-01',
      email: 'admin@vyaparsuite.com',
      name: 'Sanjay Kumar Panda',
      role: 'System Administrator',
      initials: 'SK',
    },
    tenantId: 'tenant-vyapar-main',
    companyId: 'comp-001',
    company: {
      id: 'comp-001',
      name: 'VyaparSuite Technologies Pvt Ltd',
      code: 'VST-HQ',
      currency: 'INR',
      gstin: '27AABCV1234F1Z5',
      isDefault: true,
    },
    companies: [
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
    ],
    branch: {
      id: 'br-001',
      name: 'Corporate HQ - Mumbai',
      code: 'MUM-HQ',
      companyId: 'comp-001',
    },
    branches: [
      { id: 'br-001', name: 'Corporate HQ - Mumbai', code: 'MUM-HQ', companyId: 'comp-001' },
      { id: 'br-002', name: 'Manufacturing Plant - Pune', code: 'PUN-MFG', companyId: 'comp-001' },
      { id: 'br-003', name: 'Central Warehouse - Bhiwandi', code: 'BHW-WH', companyId: 'comp-001' },
    ],
    financialYear: '2024-2025',
    financialYears: ['2024-2025', '2023-2024', '2022-2023'],
  };

  await setServerSessionCookie(demoSession);
  redirect('/dashboard');
}

/**
 * Signs the user out and clears session cookies
 */
export async function logoutAction() {
  await clearServerSessionCookie();
  redirect('/login');
}

/**
 * Switches the active legal company in session
 */
export async function switchCompanyAction(companyId: string) {
  const session = await getServerSession();
  if (!session) return;

  const targetCompany = session.companies.find((c) => c.id === companyId);
  if (!targetCompany) return;

  const updated: ERPSession = {
    ...session,
    companyId: targetCompany.id,
    company: targetCompany,
  };

  await setServerSessionCookie(updated);
  revalidatePath('/', 'layout');
}

/**
 * Switches the active physical branch in session
 */
export async function switchBranchAction(branchId: string) {
  const session = await getServerSession();
  if (!session) return;

  const targetBranch = session.branches.find((b) => b.id === branchId);
  if (!targetBranch) return;

  const updated: ERPSession = {
    ...session,
    branch: targetBranch,
  };

  await setServerSessionCookie(updated);
  revalidatePath('/', 'layout');
}

/**
 * Switches the active financial year
 */
export async function switchFinancialYearAction(financialYear: string) {
  const session = await getServerSession();
  if (!session) return;

  const updated: ERPSession = {
    ...session,
    financialYear,
  };

  await setServerSessionCookie(updated);
  revalidatePath('/', 'layout');
}
