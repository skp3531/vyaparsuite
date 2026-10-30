import { describe, it, expect, beforeEach } from './helpers/test-runner';
import { AccountService } from '@/modules/setup/services/account-service';
import { MockDatabaseAdapter } from './helpers/mock-db-adapter';
import { BusinessRuleError, ConflictError } from '@/lib/utils/errors';

describe('AccountService', () => {
  let db: MockDatabaseAdapter;
  let service: AccountService;
  const tenantId = '00000000-0000-4000-a000-000000000001';
  const companyId = '11111111-1111-4111-a111-111111111111';
  const userId = '22222222-2222-4222-a222-222222222222';
  const context = { tenantId, companyId, userId };

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    service = new AccountService(db);
  });

  it('creates an account group and leaf account', async () => {
    const group = await service.createAccountGroup(
      {
        company_id: companyId,
        group_name: 'Current Assets',
        root_type: 'Asset',
      },
      context
    );
    expect(group.id).toBeDefined();
    expect(group.group_name).toBe('Current Assets');

    const account = await service.createAccount(
      {
        company_id: companyId,
        account_name: 'HDFC Bank Operative A/c',
        account_number: '111001',
        account_group_id: group.id!,
        account_type: 'Bank',
        currency: 'INR',
        is_group: false,
      },
      context
    );

    expect(account.id).toBeDefined();
    expect(account.account_name).toBe('HDFC Bank Operative A/c');
    expect(account.root_type).toBe('Asset');
  });

  it('prevents posting to a group account', async () => {
    const group = await service.createAccountGroup(
      {
        company_id: companyId,
        group_name: 'Bank Accounts',
        root_type: 'Asset',
      },
      context
    );

    const groupAccount = await service.createAccount(
      {
        company_id: companyId,
        account_name: 'All Banks Group Header',
        account_number: '111000',
        account_group_id: group.id!,
        is_group: true,
      },
      context
    );

    await expect(
      service.validateAccountPosting(groupAccount.id!, tenantId, companyId)
    ).rejects.toThrow(BusinessRuleError);
  });

  it('validates posting for active leaf accounts', async () => {
    const group = await service.createAccountGroup(
      {
        company_id: companyId,
        group_name: 'Operating Income',
        root_type: 'Income',
      },
      context
    );

    const leafAccount = await service.createAccount(
      {
        company_id: companyId,
        account_name: 'Sales Domestic',
        account_number: '411001',
        account_group_id: group.id!,
        account_type: 'Income Account',
        is_group: false,
      },
      context
    );

    const result = await service.validateAccountPosting(leafAccount.id!, tenantId, companyId);
    expect(result.isValid).toBe(true);
    expect(result.account.account_name).toBe('Sales Domestic');
  });

  it('builds a nested chart of accounts tree', async () => {
    const assetGroup = await service.createAccountGroup(
      {
        company_id: companyId,
        group_name: 'Assets',
        root_type: 'Asset',
      },
      context
    );

    const bankGroup = await service.createAccountGroup(
      {
        company_id: companyId,
        group_name: 'Bank Accounts',
        parent_group_id: assetGroup.id,
        root_type: 'Asset',
      },
      context
    );

    await service.createAccount(
      {
        company_id: companyId,
        account_name: 'ICICI Current A/c',
        account_number: '111002',
        account_group_id: bankGroup.id!,
        account_type: 'Bank',
        is_group: false,
      },
      context
    );

    const tree = await service.getAccountTree(tenantId, companyId);
    expect(tree.length).toBeGreaterThan(0);
    const rootNode = tree.find((n) => n.name === 'Assets');
    expect(rootNode).toBeDefined();
    expect(rootNode?.children.length).toBe(1);
    expect(rootNode?.children[0].name).toBe('Bank Accounts');
    expect(rootNode?.children[0].children[0].name).toBe('ICICI Current A/c');
  });
});
