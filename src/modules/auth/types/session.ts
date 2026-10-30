export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
  initials?: string;
}

export interface CompanyOption {
  id: string;
  name: string;
  code: string;
  currency: string;
  gstin?: string;
  isDefault?: boolean;
}

export interface BranchOption {
  id: string;
  name: string;
  code: string;
  companyId: string;
}

export interface FinancialYearOption {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface ERPSession {
  user: UserSession;
  tenantId: string;
  companyId: string;
  company: CompanyOption;
  companies: CompanyOption[];
  branch: BranchOption;
  branches: BranchOption[];
  financialYear: string;
  financialYears: string[];
}
