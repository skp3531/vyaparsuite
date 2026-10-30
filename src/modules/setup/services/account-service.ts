/**
 * VyaparSuite Chart of Accounts (COA) Service
 * 
 * Manages company financial account hierarchy, general ledger classification,
 * tree navigation, account creation rules, and strict posting validation
 * preventing journal entries on group header accounts.
 */

import type { IDatabaseAdapter } from '@/lib/db/adapter';
import { createSupabaseAdapter } from '@/lib/db/supabase-adapter';
import { createServerClient } from '@/lib/db/client';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  BusinessRuleError,
} from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import {
  Account,
  AccountGroup,
  AccountRootType,
  AccountType,
  CreateAccountInput,
  UpdateAccountInput,
  CreateAccountGroupInput,
  UpdateAccountGroupInput,
  createAccountSchema,
  updateAccountSchema,
  createAccountGroupSchema,
  updateAccountGroupSchema,
} from '../schemas/account.schema';

export interface ServiceContext {
  tenantId: string;
  companyId?: string;
  userId: string;
  userEmail?: string;
}

export interface AccountTreeNode {
  id: string;
  name: string;
  code?: string | null;
  nodeType: 'group' | 'account';
  rootType: AccountRootType;
  accountType?: AccountType | null;
  isGroup: boolean;
  currency: string;
  isActive: boolean;
  parentId?: string | null;
  children: AccountTreeNode[];
}

export interface AccountTreeOptions {
  rootType?: AccountRootType;
  includeInactive?: boolean;
}

export class AccountService {
  private db: IDatabaseAdapter;

  constructor(db?: IDatabaseAdapter) {
    this.db = db ?? createSupabaseAdapter(createServerClient());
  }

  /**
   * Retrieves the full nested Chart of Accounts tree for a company
   */
  async getAccountTree(
    tenantId: string,
    companyId: string,
    options?: AccountTreeOptions
  ): Promise<AccountTreeNode[]> {
    logger.debug('Building Chart of Accounts tree', { tenantId, companyId, ...options });

    // 1. Fetch all account groups for the company
    const groupFilters: Array<{ column: string; operator: 'eq'; value: unknown }> = [
      { column: 'tenant_id', operator: 'eq', value: tenantId },
      { column: 'company_id', operator: 'eq', value: companyId },
    ];
    if (!options?.includeInactive) {
      groupFilters.push({ column: 'is_active', operator: 'eq', value: true });
    }
    if (options?.rootType) {
      groupFilters.push({ column: 'root_type', operator: 'eq', value: options.rootType });
    }

    const groupsRes = await this.db.findMany<AccountGroup>('account_group', {
      filters: groupFilters,
      sort: [{ column: 'group_name', direction: 'asc' }],
    });

    if (groupsRes.error) {
      throw new BusinessRuleError(`Failed to load account groups: ${groupsRes.error.message}`);
    }

    // 2. Fetch all accounts for the company
    const accountFilters: Array<{ column: string; operator: 'eq'; value: unknown }> = [
      { column: 'tenant_id', operator: 'eq', value: tenantId },
      { column: 'company_id', operator: 'eq', value: companyId },
    ];
    if (!options?.includeInactive) {
      accountFilters.push({ column: 'is_active', operator: 'eq', value: true });
    }
    if (options?.rootType) {
      accountFilters.push({ column: 'root_type', operator: 'eq', value: options.rootType });
    }

    const accountsRes = await this.db.findMany<Account>('account', {
      filters: accountFilters,
      sort: [
        { column: 'account_number', direction: 'asc' },
        { column: 'account_name', direction: 'asc' },
      ],
    });

    if (accountsRes.error) {
      throw new BusinessRuleError(`Failed to load accounts: ${accountsRes.error.message}`);
    }

    const groups = groupsRes.data || [];
    const accounts = accountsRes.data || [];

    // 3. Transform groups and accounts into node maps
    const nodeMap = new Map<string, AccountTreeNode>();

    for (const g of groups) {
      if (!g.id) continue;
      nodeMap.set(g.id, {
        id: g.id,
        name: g.group_name,
        nodeType: 'group',
        rootType: g.root_type,
        isGroup: true,
        currency: 'INR',
        isActive: g.is_active,
        parentId: g.parent_group_id,
        children: [],
      });
    }

    // Accounts belong to account groups
    const accountNodes: AccountTreeNode[] = [];
    for (const a of accounts) {
      if (!a.id) continue;
      const accNode: AccountTreeNode = {
        id: a.id,
        name: a.account_name,
        code: a.account_number,
        nodeType: 'account',
        rootType: a.root_type,
        accountType: a.account_type,
        isGroup: a.is_group,
        currency: a.currency,
        isActive: a.is_active,
        parentId: a.account_group_id,
        children: [],
      };
      accountNodes.push(accNode);
    }

    // 4. Assemble tree
    const rootNodes: AccountTreeNode[] = [];

    // Link sub-groups to parent groups
    for (const groupNode of nodeMap.values()) {
      if (groupNode.parentId && nodeMap.has(groupNode.parentId)) {
        nodeMap.get(groupNode.parentId)!.children.push(groupNode);
      } else {
        rootNodes.push(groupNode);
      }
    }

    // Link accounts to their parent groups
    for (const accNode of accountNodes) {
      if (accNode.parentId && nodeMap.has(accNode.parentId)) {
        nodeMap.get(accNode.parentId)!.children.push(accNode);
      } else {
        // Orphan account without valid group attaches to root
        rootNodes.push(accNode);
      }
    }

    return rootNodes;
  }

  /**
   * Creates a new Account record with strict integrity and hierarchy validations
   */
  async createAccount(
    input: CreateAccountInput,
    context: ServiceContext
  ): Promise<Account> {
    const parsed = createAccountSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        'Account validation failed',
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }
    const data = parsed.data;

    const companyId = data.company_id || context.companyId;
    if (!companyId) {
      throw new ValidationError('Company ID is required to create an account');
    }

    // 1. Verify parent account group exists and belongs to company
    const groupRes = await this.db.findById<AccountGroup>('account_group', data.account_group_id, {
      tenantId: context.tenantId,
    });
    if (groupRes.error || !groupRes.data) {
      throw new NotFoundError('AccountGroup', data.account_group_id);
    }
    const parentGroup = groupRes.data;
    if (parentGroup.company_id !== companyId) {
      throw new BusinessRuleError('Account group does not belong to the selected company');
    }

    // 2. Ensure root_type matches parent group's root_type
    const resolvedRootType = parentGroup.root_type;

    // 3. Unique name check within company
    const existingNameRes = await this.db.findOne<Account>('account', [
      { column: 'tenant_id', operator: 'eq', value: context.tenantId },
      { column: 'company_id', operator: 'eq', value: companyId },
      { column: 'account_name', operator: 'eq', value: data.account_name },
    ]);
    if (existingNameRes.data) {
      throw new ConflictError(
        `An account with name '${data.account_name}' already exists in this company`
      );
    }

    // 4. Unique code check within company if code is provided
    if (data.account_number && data.account_number.trim().length > 0) {
      const existingCodeRes = await this.db.findOne<Account>('account', [
        { column: 'tenant_id', operator: 'eq', value: context.tenantId },
        { column: 'company_id', operator: 'eq', value: companyId },
        { column: 'account_number', operator: 'eq', value: data.account_number.trim() },
      ]);
      if (existingCodeRes.data) {
        throw new ConflictError(
          `An account with code '${data.account_number}' already exists in this company`
        );
      }
    }

    const payload: Record<string, unknown> = {
      ...data,
      company_id: companyId,
      root_type: resolvedRootType,
      tenant_id: context.tenantId,
      created_by: context.userId,
      updated_by: context.userId,
    };

    const insertRes = await this.db.insert<Account>('account', payload);
    if (insertRes.error || !insertRes.data) {
      throw new BusinessRuleError(`Failed to create account: ${insertRes.error?.message}`);
    }

    logger.info('Account created successfully', {
      accountId: insertRes.data.id,
      companyId,
      accountName: data.account_name,
    });

    return insertRes.data;
  }

  /**
   * Updates an existing account
   */
  async updateAccount(
    id: string,
    input: UpdateAccountInput,
    context: ServiceContext
  ): Promise<Account> {
    const existingRes = await this.db.findById<Account>('account', id, {
      tenantId: context.tenantId,
    });
    if (existingRes.error || !existingRes.data) {
      throw new NotFoundError('Account', id);
    }
    const existing = existingRes.data;

    const parsed = updateAccountSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        'Account update validation failed',
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }
    const data = parsed.data;

    // Check unique account name if changed
    if (data.account_name && data.account_name !== existing.account_name) {
      const dupRes = await this.db.findOne<Account>('account', [
        { column: 'tenant_id', operator: 'eq', value: context.tenantId },
        { column: 'company_id', operator: 'eq', value: existing.company_id },
        { column: 'account_name', operator: 'eq', value: data.account_name },
      ]);
      if (dupRes.data && dupRes.data.id !== id) {
        throw new ConflictError(
          `An account with name '${data.account_name}' already exists in this company`
        );
      }
    }

    // Check unique account number if changed
    if (data.account_number && data.account_number !== existing.account_number) {
      const dupRes = await this.db.findOne<Account>('account', [
        { column: 'tenant_id', operator: 'eq', value: context.tenantId },
        { column: 'company_id', operator: 'eq', value: existing.company_id },
        { column: 'account_number', operator: 'eq', value: data.account_number },
      ]);
      if (dupRes.data && dupRes.data.id !== id) {
        throw new ConflictError(
          `An account with number '${data.account_number}' already exists in this company`
        );
      }
    }

    const payload: Record<string, unknown> = {
      ...data,
      updated_by: context.userId,
    };

    const updateRes = await this.db.update<Account>('account', id, payload, {
      tenantId: context.tenantId,
    });
    if (updateRes.error || !updateRes.data) {
      throw new BusinessRuleError(`Failed to update account: ${updateRes.error?.message}`);
    }

    return updateRes.data;
  }

  /**
   * Retrieves an account by primary ID
   */
  async getAccountById(id: string, tenantId: string): Promise<Account> {
    const res = await this.db.findById<Account>('account', id, { tenantId });
    if (res.error || !res.data) {
      throw new NotFoundError('Account', id);
    }
    return res.data;
  }

  /**
   * Retrieves all active accounts filtered by root classification type (Asset, Liability, etc.)
   */
  async getAccountsByRootType(
    tenantId: string,
    companyId: string,
    rootType: AccountRootType
  ): Promise<Account[]> {
    const res = await this.db.findMany<Account>('account', {
      filters: [
        { column: 'tenant_id', operator: 'eq', value: tenantId },
        { column: 'company_id', operator: 'eq', value: companyId },
        { column: 'root_type', operator: 'eq', value: rootType },
        { column: 'is_active', operator: 'eq', value: true },
      ],
      sort: [
        { column: 'account_number', direction: 'asc' },
        { column: 'account_name', direction: 'asc' },
      ],
    });

    if (res.error) {
      throw new BusinessRuleError(
        `Failed to retrieve accounts for root type ${rootType}: ${res.error.message}`
      );
    }

    return res.data || [];
  }

  /**
   * Validates if an account is eligible for general ledger debit/credit postings.
   * Statutory rule: Ledger postings are strictly prohibited on group header accounts.
   */
  async validateAccountPosting(
    accountId: string,
    tenantId: string,
    companyId: string
  ): Promise<{ isValid: boolean; account: Account }> {
    const res = await this.db.findById<Account>('account', accountId, { tenantId });
    if (res.error || !res.data) {
      throw new NotFoundError('Account', accountId);
    }

    const account = res.data;

    // Check company ownership
    if (account.company_id !== companyId) {
      throw new BusinessRuleError(
        `Account '${account.account_name}' does not belong to company '${companyId}'`
      );
    }

    // Check active status
    if (!account.is_active) {
      throw new BusinessRuleError(
        `Account '${account.account_name}' (${account.account_number || accountId}) is deactivated and cannot accept new transactions`
      );
    }

    // Check is_group rule
    if (account.is_group) {
      throw new BusinessRuleError(
        `Posting not allowed: Account '${account.account_name}' is a parent group header. Double-entry transactions must reference leaf accounts only.`
      );
    }

    return { isValid: true, account };
  }

  /**
   * Creates an Account Group
   */
  async createAccountGroup(
    input: CreateAccountGroupInput,
    context: ServiceContext
  ): Promise<AccountGroup> {
    const parsed = createAccountGroupSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        'Account group validation failed',
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }
    const data = parsed.data;
    const companyId = data.company_id || context.companyId;

    if (!companyId) {
      throw new ValidationError('Company ID is required to create an account group');
    }

    // Check uniqueness within company
    const dupRes = await this.db.findOne<AccountGroup>('account_group', [
      { column: 'tenant_id', operator: 'eq', value: context.tenantId },
      { column: 'company_id', operator: 'eq', value: companyId },
      { column: 'group_name', operator: 'eq', value: data.group_name },
    ]);
    if (dupRes.data) {
      throw new ConflictError(
        `An account group with name '${data.group_name}' already exists in this company`
      );
    }

    // If parent group is specified, inherit root_type and verify validity
    let rootType = data.root_type;
    if (data.parent_group_id) {
      const parentRes = await this.db.findById<AccountGroup>(
        'account_group',
        data.parent_group_id,
        { tenantId: context.tenantId }
      );
      if (parentRes.error || !parentRes.data) {
        throw new NotFoundError('Parent AccountGroup', data.parent_group_id);
      }
      rootType = parentRes.data.root_type;
    }

    const payload: Record<string, unknown> = {
      ...data,
      company_id: companyId,
      root_type: rootType,
      tenant_id: context.tenantId,
      created_by: context.userId,
      updated_by: context.userId,
    };

    const insertRes = await this.db.insert<AccountGroup>('account_group', payload);
    if (insertRes.error || !insertRes.data) {
      throw new BusinessRuleError(
        `Failed to create account group: ${insertRes.error?.message}`
      );
    }

    return insertRes.data;
  }

  /**
   * Lists account groups for a company
   */
  async getAccountGroups(tenantId: string, companyId: string): Promise<AccountGroup[]> {
    const res = await this.db.findMany<AccountGroup>('account_group', {
      filters: [
        { column: 'tenant_id', operator: 'eq', value: tenantId },
        { column: 'company_id', operator: 'eq', value: companyId },
      ],
      sort: [{ column: 'group_name', direction: 'asc' }],
    });

    if (res.error) {
      throw new BusinessRuleError(`Failed to list account groups: ${res.error.message}`);
    }

    return res.data || [];
  }

  /**
   * Safely deletes an account if it has no transactional GL entries
   */
  async deleteAccount(id: string, context: ServiceContext): Promise<void> {
    const account = await this.getAccountById(id, context.tenantId);

    // Verify no GL entries exist for this account
    const glCountRes = await this.db.count('gl_entry', [
      { column: 'tenant_id', operator: 'eq', value: context.tenantId },
      { column: 'account_id', operator: 'eq', value: id },
    ]);

    if (glCountRes.count && glCountRes.count > 0) {
      throw new BusinessRuleError(
        `Account '${account.account_name}' cannot be deleted because it contains ${glCountRes.count} general ledger transaction(s). Deactivate the account instead.`
      );
    }

    const delRes = await this.db.softDelete('account', id, context.userId, {
      tenantId: context.tenantId,
    });
    if (delRes.error) {
      throw new BusinessRuleError(`Failed to delete account: ${delRes.error.message}`);
    }

    logger.info('Account deleted (soft-delete)', { accountId: id, tenantId: context.tenantId });
  }
}
