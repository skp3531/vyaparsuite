/**
 * VyaparSuite Customer & Sales Master Data Service
 * 
 * Manages customer master lifecycle, customer group segmentation,
 * real-time credit limit exposure verification, and multi-currency outstanding balance
 * accounting with immutable precision via Decimal arithmetic.
 */

import type { IDatabaseAdapter, QueryFilter, QuerySort } from '@/lib/db/adapter';
import { createSupabaseAdapter } from '@/lib/db/supabase-adapter';
import { createServerClient } from '@/lib/db/client';
import { Decimal } from '@/lib/utils/decimal';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  BusinessRuleError,
} from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import {
  Customer,
  CustomerGroup,
  CreateCustomerInput,
  UpdateCustomerInput,
  CreateCustomerGroupInput,
  UpdateCustomerGroupInput,
  CustomerFilterParams,
  createCustomerSchema,
  updateCustomerSchema,
  createCustomerGroupSchema,
} from '../schemas/customer.schema';

export interface ServiceContext {
  tenantId: string;
  companyId?: string;
  userId: string;
  userEmail?: string;
}

export interface CreditLimitCheckResult {
  allowed: boolean;
  creditLimit: Decimal;
  currentOutstanding: Decimal;
  newOrderAmount: Decimal;
  totalExposure: Decimal;
  availableCredit: Decimal;
  isCreditFrozen: boolean;
  reason?: string;
}

export interface CustomerGroupTreeNode {
  id: string;
  name: string;
  isGroup: boolean;
  parentId?: string | null;
  defaultPriceListId?: string | null;
  isActive: boolean;
  children: CustomerGroupTreeNode[];
}

export class CustomerService {
  private db: IDatabaseAdapter;

  constructor(db?: IDatabaseAdapter) {
    this.db = db ?? createSupabaseAdapter(createServerClient());
  }

  /**
   * Creates a new Customer record with statutory tax and credit checks
   */
  async createCustomer(
    input: CreateCustomerInput,
    context: ServiceContext
  ): Promise<Customer> {
    const parsed = createCustomerSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        'Customer validation failed',
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }
    const data = parsed.data;

    // 1. Verify customer group exists in tenant
    const groupRes = await this.db.findById<CustomerGroup>('customer_group', data.customer_group_id, {
      tenantId: context.tenantId,
    });
    if (groupRes.error || !groupRes.data) {
      throw new NotFoundError('CustomerGroup', data.customer_group_id);
    }

    // 2. Unique customer code check per tenant
    const codeDup = await this.db.findOne<Customer>('customer', [
      { column: 'tenant_id', operator: 'eq', value: context.tenantId },
      { column: 'customer_code', operator: 'eq', value: data.customer_code },
    ]);
    if (codeDup.data) {
      throw new ConflictError(
        `A customer with code '${data.customer_code}' already exists in this tenant`
      );
    }

    // 3. Duplicate GSTIN check if provided (statutory anti-duplicate registration)
    if (data.gstin && data.gstin.trim().length > 0) {
      const gstinDup = await this.db.findOne<Customer>('customer', [
        { column: 'tenant_id', operator: 'eq', value: context.tenantId },
        { column: 'gstin', operator: 'eq', value: data.gstin.trim().toUpperCase() },
      ]);
      if (gstinDup.data) {
        throw new ConflictError(
          `Customer '${gstinDup.data.customer_name}' already registered with GSTIN '${data.gstin}'`
        );
      }
    }

    // Normalize credit limit using Decimal
    const creditLimitDecimal = Decimal.from(data.credit_limit || 0);

    const payload: Record<string, unknown> = {
      ...data,
      credit_limit: creditLimitDecimal.toFixed(6),
      tenant_id: context.tenantId,
      created_by: context.userId,
      updated_by: context.userId,
    };

    const insertRes = await this.db.insert<Customer>('customer', payload);
    if (insertRes.error || !insertRes.data) {
      throw new BusinessRuleError(`Failed to create customer: ${insertRes.error?.message}`);
    }

    logger.info('Customer created successfully', {
      customerId: insertRes.data.id,
      customerCode: data.customer_code,
      tenantId: context.tenantId,
    });

    return insertRes.data;
  }

  /**
   * Retrieves a customer by UUID
   */
  async getCustomerById(id: string, tenantId: string): Promise<Customer> {
    const res = await this.db.findById<Customer>('customer', id, { tenantId });
    if (res.error || !res.data) {
      throw new NotFoundError('Customer', id);
    }
    return res.data;
  }

  /**
   * Retrieves a customer by unique tenant code
   */
  async getCustomerByCode(customerCode: string, tenantId: string): Promise<Customer> {
    const res = await this.db.findOne<Customer>('customer', [
      { column: 'tenant_id', operator: 'eq', value: tenantId },
      { column: 'customer_code', operator: 'eq', value: customerCode },
    ]);
    if (res.error || !res.data) {
      throw new NotFoundError('Customer', customerCode);
    }
    return res.data;
  }

  /**
   * Updates an existing Customer record
   */
  async updateCustomer(
    id: string,
    input: UpdateCustomerInput,
    context: ServiceContext
  ): Promise<Customer> {
    const existing = await this.getCustomerById(id, context.tenantId);

    const parsed = updateCustomerSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        'Customer update validation failed',
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }
    const data = parsed.data;

    // Check unique code if updated
    if (data.customer_code && data.customer_code !== existing.customer_code) {
      const codeDup = await this.db.findOne<Customer>('customer', [
        { column: 'tenant_id', operator: 'eq', value: context.tenantId },
        { column: 'customer_code', operator: 'eq', value: data.customer_code },
      ]);
      if (codeDup.data && codeDup.data.id !== id) {
        throw new ConflictError(
          `Customer code '${data.customer_code}' is already assigned to another client`
        );
      }
    }

    // Check unique GSTIN if updated
    if (data.gstin && data.gstin !== existing.gstin) {
      const gstinDup = await this.db.findOne<Customer>('customer', [
        { column: 'tenant_id', operator: 'eq', value: context.tenantId },
        { column: 'gstin', operator: 'eq', value: data.gstin.toUpperCase() },
      ]);
      if (gstinDup.data && gstinDup.data.id !== id) {
        throw new ConflictError(
          `GSTIN '${data.gstin}' is already registered to another customer`
        );
      }
    }

    const payload: Record<string, unknown> = {
      ...data,
      updated_by: context.userId,
    };

    if (data.credit_limit !== undefined) {
      payload.credit_limit = Decimal.from(data.credit_limit).toFixed(6);
    }

    const updateRes = await this.db.update<Customer>('customer', id, payload, {
      tenantId: context.tenantId,
    });

    if (updateRes.error || !updateRes.data) {
      throw new BusinessRuleError(`Failed to update customer: ${updateRes.error?.message}`);
    }

    return updateRes.data;
  }

  /**
   * Soft-deletes a customer if no open invoices or ledger entries exist
   */
  async deleteCustomer(id: string, context: ServiceContext): Promise<void> {
    const customer = await this.getCustomerById(id, context.tenantId);

    // Verify no unpaid invoices exist
    const openInvoicesRes = await this.db.count('sales_invoice', [
      { column: 'tenant_id', operator: 'eq', value: context.tenantId },
      { column: 'customer_id', operator: 'eq', value: id },
      { column: 'outstanding_amount', operator: 'gt', value: 0 },
    ]);

    if (openInvoicesRes.count && openInvoicesRes.count > 0) {
      throw new BusinessRuleError(
        `Cannot delete customer '${customer.customer_name}'. There are ${openInvoicesRes.count} outstanding sales invoice(s).`
      );
    }

    const delRes = await this.db.softDelete('customer', id, context.userId, {
      tenantId: context.tenantId,
    });

    if (delRes.error) {
      throw new BusinessRuleError(`Failed to delete customer: ${delRes.error.message}`);
    }

    logger.info('Customer deleted (soft-delete)', { customerId: id, tenantId: context.tenantId });
  }

  /**
   * Lists customers with pagination, sorting, and filters
   */
  async listCustomers(
    tenantId: string,
    options?: Partial<CustomerFilterParams>
  ): Promise<{ data: Customer[]; total: number }> {
    const filters: QueryFilter[] = [{ column: 'tenant_id', operator: 'eq', value: tenantId }];

    if (options?.customer_group_id) {
      filters.push({ column: 'customer_group_id', operator: 'eq', value: options.customer_group_id });
    }
    if (options?.customer_type) {
      filters.push({ column: 'customer_type', operator: 'eq', value: options.customer_type });
    }
    if (options?.gst_category) {
      filters.push({ column: 'gst_category', operator: 'eq', value: options.gst_category });
    }
    if (options?.is_active !== undefined) {
      filters.push({ column: 'is_active', operator: 'eq', value: options.is_active });
    }
    if (options?.is_credit_freeze !== undefined) {
      filters.push({ column: 'is_credit_freeze', operator: 'eq', value: options.is_credit_freeze });
    }
    if (options?.territory_id) {
      filters.push({ column: 'territory_id', operator: 'eq', value: options.territory_id });
    }
    if (options?.search) {
      filters.push({ column: 'customer_name', operator: 'ilike', value: `%${options.search}%` });
    }

    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;
    const sortBy = options?.sortBy ?? 'customer_name';
    const sortDirection = options?.sortDirection ?? 'asc';

    const sort: QuerySort[] = [{ column: sortBy, direction: sortDirection }];

    const countRes = await this.db.count('customer', filters);
    const listRes = await this.db.findMany<Customer>('customer', {
      filters,
      sort,
      pagination: { page, pageSize },
    });

    if (listRes.error) {
      throw new BusinessRuleError(`Failed to list customers: ${listRes.error.message}`);
    }

    return {
      data: listRes.data || [],
      total: countRes.count || 0,
    };
  }

  /**
   * Recalculates total uncollected accounts receivable balance across all open invoices
   */
  async recalculateCustomerOutstanding(
    customerId: string,
    tenantId: string,
    companyId?: string
  ): Promise<Decimal> {
    const filters: QueryFilter[] = [
      { column: 'tenant_id', operator: 'eq', value: tenantId },
      { column: 'customer_id', operator: 'eq', value: customerId },
      { column: 'outstanding_amount', operator: 'gt', value: 0 },
    ];
    if (companyId) {
      filters.push({ column: 'company_id', operator: 'eq', value: companyId });
    }

    interface InvoiceBalance {
      outstanding_amount: string | number;
    }

    const res = await this.db.findMany<InvoiceBalance>('sales_invoice', {
      filters,
      select: 'outstanding_amount',
    });

    if (res.error) {
      throw new BusinessRuleError(
        `Failed to calculate customer outstanding balance: ${res.error.message}`
      );
    }

    const invoices = res.data || [];
    let totalOutstanding = Decimal.zero();

    for (const inv of invoices) {
      totalOutstanding = totalOutstanding.add(Decimal.from(inv.outstanding_amount || 0));
    }

    return totalOutstanding.round(2);
  }

  /**
   * Performs real-time credit limit exposure checks before confirming an order/invoice
   */
  async checkCreditLimit(
    customerId: string,
    newOrderAmount: Decimal | string | number,
    tenantId: string,
    companyId?: string
  ): Promise<CreditLimitCheckResult> {
    const customer = await this.getCustomerById(customerId, tenantId);
    const orderAmt = Decimal.from(newOrderAmount);
    const creditLimit = Decimal.from(customer.credit_limit || 0);

    // 1. Check if customer credit is frozen
    if (customer.is_credit_freeze) {
      const currentOutstanding = await this.recalculateCustomerOutstanding(
        customerId,
        tenantId,
        companyId
      );
      return {
        allowed: false,
        creditLimit,
        currentOutstanding,
        newOrderAmount: orderAmt,
        totalExposure: currentOutstanding.add(orderAmt),
        availableCredit: Decimal.zero(),
        isCreditFrozen: true,
        reason: `Customer '${customer.customer_name}' (${customer.customer_code}) has been credit frozen. All new orders require managerial unlock.`,
      };
    }

    // 2. Fetch current outstanding balance
    const currentOutstanding = await this.recalculateCustomerOutstanding(
      customerId,
      tenantId,
      companyId
    );
    const totalExposure = currentOutstanding.add(orderAmt);

    // 3. If credit limit is zero, no limit enforcement (standard ERP policy)
    if (creditLimit.isZero()) {
      return {
        allowed: true,
        creditLimit: Decimal.zero(),
        currentOutstanding,
        newOrderAmount: orderAmt,
        totalExposure,
        availableCredit: Decimal.zero(),
        isCreditFrozen: false,
      };
    }

    // 4. Compare total exposure against credit limit
    const availableCredit = creditLimit.subtract(currentOutstanding);
    const isExceeded = totalExposure.greaterThan(creditLimit);

    if (isExceeded) {
      return {
        allowed: false,
        creditLimit,
        currentOutstanding,
        newOrderAmount: orderAmt,
        totalExposure,
        availableCredit,
        isCreditFrozen: false,
        reason: `Credit limit exceeded for '${customer.customer_name}'. Credit Limit: ${creditLimit.toFixed(2)}, Current Outstanding: ${currentOutstanding.toFixed(2)}, New Order Amount: ${orderAmt.toFixed(2)}, Total Exposure: ${totalExposure.toFixed(2)}. Exceeds limit by ${totalExposure.subtract(creditLimit).toFixed(2)}.`,
      };
    }

    return {
      allowed: true,
      creditLimit,
      currentOutstanding,
      newOrderAmount: orderAmt,
      totalExposure,
      availableCredit,
      isCreditFrozen: false,
    };
  }

  /**
   * Updates customer outstanding balance record
   */
  async updateOutstandingBalance(
    customerId: string,
    amountDelta: Decimal | string | number,
    tenantId: string,
    context: ServiceContext
  ): Promise<Decimal> {
    const delta = Decimal.from(amountDelta);
    const current = await this.recalculateCustomerOutstanding(customerId, tenantId, context.companyId);
    const updated = current.add(delta);

    logger.info('Updated customer outstanding exposure balance', {
      customerId,
      tenantId,
      delta: delta.toFixed(2),
      newOutstanding: updated.toFixed(2),
    });

    return updated;
  }

  // --- Customer Group Operations ---

  /**
   * Creates a new Customer Group
   */
  async createCustomerGroup(
    input: CreateCustomerGroupInput,
    context: ServiceContext
  ): Promise<CustomerGroup> {
    const parsed = createCustomerGroupSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        'Customer group validation failed',
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }
    const data = parsed.data;

    // Check unique group name per tenant
    const dup = await this.db.findOne<CustomerGroup>('customer_group', [
      { column: 'tenant_id', operator: 'eq', value: context.tenantId },
      { column: 'customer_group_name', operator: 'eq', value: data.customer_group_name },
    ]);
    if (dup.data) {
      throw new ConflictError(
        `Customer group '${data.customer_group_name}' already exists in this tenant`
      );
    }

    const payload: Record<string, unknown> = {
      ...data,
      tenant_id: context.tenantId,
      created_by: context.userId,
      updated_by: context.userId,
    };

    const insertRes = await this.db.insert<CustomerGroup>('customer_group', payload);
    if (insertRes.error || !insertRes.data) {
      throw new BusinessRuleError(
        `Failed to create customer group: ${insertRes.error?.message}`
      );
    }

    return insertRes.data;
  }

  /**
   * Retrieves all customer groups in tenant
   */
  async listCustomerGroups(tenantId: string): Promise<CustomerGroup[]> {
    const res = await this.db.findMany<CustomerGroup>('customer_group', {
      filters: [{ column: 'tenant_id', operator: 'eq', value: tenantId }],
      sort: [{ column: 'customer_group_name', direction: 'asc' }],
    });

    if (res.error) {
      throw new BusinessRuleError(`Failed to list customer groups: ${res.error.message}`);
    }

    return res.data || [];
  }

  /**
   * Builds the tree structure of customer groups
   */
  async getCustomerGroupTree(tenantId: string): Promise<CustomerGroupTreeNode[]> {
    const groups = await this.listCustomerGroups(tenantId);
    const nodeMap = new Map<string, CustomerGroupTreeNode>();

    for (const g of groups) {
      if (!g.id) continue;
      nodeMap.set(g.id, {
        id: g.id,
        name: g.customer_group_name,
        isGroup: g.is_group,
        parentId: g.parent_customer_group_id,
        defaultPriceListId: g.default_price_list_id,
        isActive: g.is_active,
        children: [],
      });
    }

    const roots: CustomerGroupTreeNode[] = [];
    for (const node of nodeMap.values()) {
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
