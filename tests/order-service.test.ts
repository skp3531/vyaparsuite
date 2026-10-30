import { describe, it, expect, beforeEach } from './helpers/test-runner';
import { QuotationService } from '@/modules/sales/services/quotation-service';
import { SalesOrderService } from '@/modules/sales/services/sales-order-service';
import { CustomerService } from '@/modules/sales/services/customer-service';
import { MockDatabaseAdapter } from './helpers/mock-db';
import { Decimal } from '@/lib/utils/decimal';
import {
  BusinessRuleError,
  CreditLimitExceededError,
  AuthorizationError,
} from '@/lib/utils/errors';

describe('Quotation & SalesOrder Services', () => {
  let db: MockDatabaseAdapter;
  let qtnService: QuotationService;
  let soService: SalesOrderService;
  let customerService: CustomerService;

  const tenantId = '00000000-0000-4000-a000-000000000001';
  const companyId = '11111111-1111-4111-a111-111111111111';
  const creatorId = '22222222-2222-4222-a222-222222222222';
  const managerId = '33333333-3333-4333-a333-333333333333';
  const customerGroupId = '44444444-4444-4444-a444-444444444444';
  const itemId = '55555555-5555-4555-a555-555555555555';
  const uomId = '66666666-6666-4666-a666-666666666666';

  let customerId: string;
  const creatorContext = { tenantId, companyId, userId: creatorId };
  const managerContext = { tenantId, companyId, userId: managerId };

  beforeEach(async () => {
    db = new MockDatabaseAdapter();
    qtnService = new QuotationService(db);
    soService = new SalesOrderService(db);
    customerService = new CustomerService(db);

    const cg = await customerService.createCustomerGroup(
      { customer_group_name: 'Commercial' },
      creatorContext
    );

    // Create test customer with ₹50,000 credit limit
    const cust = await customerService.createCustomer(
      {
        customer_name: 'Bharat Tech Industries',
        customer_code: 'CUST-BTI-01',
        customer_group_id: cg.id!,
        customer_type: 'Company',
        gst_category: 'Registered Regular',
        credit_limit: '50000.000000',
      },
      creatorContext
    );
    customerId = cust.id!;
  });

  it('computes quotation line totals with discounts, 18% GST and rounding', async () => {
    const qtn = await qtnService.createQuotation(
      {
        company_id: companyId,
        customer_id: customerId,
        transaction_date: '2026-05-10',
        items: [
          {
            item_id: itemId,
            item_code: 'VALVE-SS-50',
            item_name: 'Stainless Steel Valve 50mm',
            qty: '10.000000',
            rate: '1000.000000', // Gross = 10,000
            discount_percentage: '10.000000', // Net = 9,000
            tax_rate: '18.000000', // Tax = 1,620 -> Total = 10,620
            uom_id: uomId,
          },
        ],
      },
      creatorContext
    );

    expect(qtn.id).toBeDefined();
    expect(qtn.quotation_number).toBeDefined();
    expect(Decimal.from(qtn.net_total).toNumber()).toBe(9000);
    expect(Decimal.from(qtn.tax_total).toNumber()).toBe(1620);
    expect(Decimal.from(qtn.grand_total).toNumber()).toBe(10620);
    expect(qtn.status).toBe('Draft');
  });

  it('submits quotation and converts it into a Sales Order', async () => {
    const qtn = await qtnService.createQuotation(
      {
        company_id: companyId,
        customer_id: customerId,
        transaction_date: '2026-05-10',
        items: [
          {
            item_id: itemId,
            item_code: 'PUMP-IND-01',
            item_name: 'Industrial Monoblock Pump',
            qty: '2.000000',
            rate: '15000.000000', // 30,000 + 18% tax = 35,400
            tax_rate: '18.000000',
            uom_id: uomId,
          },
        ],
      },
      creatorContext
    );

    await qtnService.submitQuotation(qtn.id!, creatorContext);

    const conversion = await qtnService.convertToSalesOrder(
      {
        quotationId: qtn.id!,
        deliveryDate: '2026-06-01',
        customerPoNo: 'PO-BTI-2026-99',
      },
      creatorContext
    );

    expect(conversion.salesOrderId).toBeDefined();
    expect(conversion.orderNumber).toBeDefined();
    expect(conversion.quotation.status).toBe('Ordered');

    const so = await soService.getSalesOrderById(conversion.salesOrderId, tenantId);
    expect(Decimal.from(so.grand_total).toNumber()).toBe(35400);
  });

  it('enforces customer credit limit before sales order confirmation', async () => {
    // Customer credit limit is ₹50,000
    // Try booking order for ₹60,000 + tax = ₹70,800
    const so = await soService.createSalesOrder(
      {
        company_id: companyId,
        customer_id: customerId,
        delivery_date: '2026-06-01',
        items: [
          {
            item_id: itemId,
            item_code: 'HEAVY-GEN-01',
            item_name: 'Heavy Diesel Generator',
            qty: '1.000000',
            rate: '60000.000000',
            tax_rate: '18.000000',
            uom_id: uomId,
          },
        ],
      },
      creatorContext
    );

    // Submitting order must fail due to credit limit violation
    await expect(
      soService.submitSalesOrder(so.id!, creatorContext)
    ).rejects.toThrow(CreditLimitExceededError);
  });

  it('enforces four-eyes principle: creator cannot approve their own Sales Order', async () => {
    const so = await soService.createSalesOrder(
      {
        company_id: companyId,
        customer_id: customerId,
        delivery_date: '2026-06-01',
        items: [
          {
            item_id: itemId,
            item_code: 'VALVE-SS-50',
            item_name: 'Stainless Steel Valve 50mm',
            qty: '2.000000',
            rate: '5000.000000',
            tax_rate: '18.000000',
            uom_id: uomId,
          },
        ],
      },
      creatorContext
    );

    await soService.submitSalesOrder(so.id!, creatorContext);

    // Creator attempting to approve their own order must be rejected
    await expect(
      soService.approveSalesOrder(so.id!, creatorContext)
    ).rejects.toThrow(AuthorizationError);

    // Designate manager can successfully approve
    const approved = await soService.approveSalesOrder(so.id!, managerContext);
    expect(approved.status).toBe('To Deliver and Bill');
  });

  it('tracks delivery and billing progress through to Completed status', async () => {
    const so = await soService.createSalesOrder(
      {
        company_id: companyId,
        customer_id: customerId,
        delivery_date: '2026-06-01',
        items: [
          {
            item_id: itemId,
            item_code: 'VALVE-SS-50',
            item_name: 'Stainless Steel Valve 50mm',
            qty: '10.000000',
            rate: '1000.000000',
            uom_id: uomId,
          },
        ],
      },
      creatorContext
    );

    // Partial delivery (5 of 10)
    const partialDelivered = await soService.updateDeliveryProgress(
      so.id!,
      { [itemId]: '5.000000' },
      tenantId
    );
    expect(Decimal.from(partialDelivered.delivered_percent).toNumber()).toBe(50);

    // Full delivery (10 of 10)
    await soService.updateDeliveryProgress(so.id!, { [itemId]: '10.000000' }, tenantId);

    // Full billing (10 of 10)
    const completed = await soService.updateBillingProgress(
      so.id!,
      { [itemId]: '10.000000' },
      tenantId
    );
    expect(Decimal.from(completed.billed_percent).toNumber()).toBe(100);
    expect(completed.status).toBe('Completed');

    // Cancellation of fulfilled order is blocked
    await expect(
      soService.cancelSalesOrder(so.id!, 'Customer requested cancellation', creatorContext)
    ).rejects.toThrow(BusinessRuleError);
  });
});
