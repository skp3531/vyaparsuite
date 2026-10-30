import { describe, it, expect, beforeEach } from './helpers/test-runner';
import { PurchaseOrderService } from '@/modules/purchase/services/purchase-order-service';
import { SupplierService } from '@/modules/purchase/services/supplier-service';
import { MockDatabaseAdapter } from './helpers/mock-db';
import { Decimal } from '@/lib/utils/decimal';
import {
  BusinessRuleError,
  AuthorizationError,
} from '@/lib/utils/errors';

describe('PurchaseOrderService', () => {
  let db: MockDatabaseAdapter;
  let poService: PurchaseOrderService;
  let supplierService: SupplierService;

  const tenantId = '00000000-0000-4000-a000-000000000001';
  const companyId = '11111111-1111-4111-a111-111111111111';
  const creatorId = '22222222-2222-4222-a222-222222222222';
  const managerId = '33333333-3333-4333-a333-333333333333';
  const supplierGroupId = '44444444-4444-4444-a444-444444444444';
  const itemId = '55555555-5555-4555-a555-555555555555';
  const uomId = '66666666-6666-4666-a666-666666666666';

  let supplierId: string;
  const creatorContext = { tenantId, companyId, userId: creatorId };
  const managerContext = { tenantId, companyId, userId: managerId, approvalLimit: '500000.000000' };

  beforeEach(async () => {
    db = new MockDatabaseAdapter();
    poService = new PurchaseOrderService(db);
    supplierService = new SupplierService(db);

    const sg = await supplierService.createSupplierGroup(
      { supplier_group_name: 'Raw Materials' },
      creatorContext
    );

    const supp = await supplierService.createSupplier(
      {
        supplier_name: 'Gujarat Alloys & Steel Ltd',
        supplier_code: 'SUPP-GAS-01',
        supplier_group_id: sg.id!,
        supplier_type: 'Company',
        gst_category: 'Registered Regular',
        gstin: '24AAACG9603R1ZT',
        pan: 'AAACG9603R',
        is_active: true,
      },
      creatorContext
    );
    supplierId = supp.id!;
  });

  it('computes purchase order line items and creates Draft PO', async () => {
    const po = await poService.createPurchaseOrder(
      {
        company_id: companyId,
        supplier_id: supplierId,
        schedule_date: '2026-06-15',
        items: [
          {
            item_id: itemId,
            item_code: 'STEEL-INGOT-01',
            item_name: 'Mild Steel Ingot 100mm',
            qty: '50.000000',
            rate: '4000.000000', // 2,00,000 + 18% tax = 2,36,000
            tax_rate: '18.000000',
            uom_id: uomId,
          },
        ],
      },
      creatorContext
    );

    expect(po.id).toBeDefined();
    expect(po.purchase_order_number).toBeDefined();
    expect(Decimal.from(po.net_total).toNumber()).toBe(200000);
    expect(Decimal.from(po.tax_total).toNumber()).toBe(36000);
    expect(Decimal.from(po.grand_total).toNumber()).toBe(236000);
    expect(po.status).toBe('Draft');
  });

  it('enforces four-eyes principle and monetary approval limits on PO', async () => {
    const po = await poService.createPurchaseOrder(
      {
        company_id: companyId,
        supplier_id: supplierId,
        schedule_date: '2026-06-15',
        items: [
          {
            item_id: itemId,
            item_code: 'STEEL-INGOT-01',
            item_name: 'Mild Steel Ingot 100mm',
            qty: '10.000000',
            rate: '10000.000000', // 1,00,000
            uom_id: uomId,
          },
        ],
      },
      creatorContext
    );

    await poService.submitPurchaseOrder(po.id!, creatorContext);

    // Creator cannot approve their own PO
    await expect(
      poService.approvePurchaseOrder(po.id!, creatorContext)
    ).rejects.toThrow(AuthorizationError);

    // Junior approver with ₹50,000 limit cannot approve ₹1,00,000 PO
    const juniorContext = { tenantId, companyId, userId: managerId, approvalLimit: '50000.000000' };
    await expect(
      poService.approvePurchaseOrder(po.id!, juniorContext)
    ).rejects.toThrow(AuthorizationError);

    // Senior manager with ₹5,00,000 limit approves successfully
    const approved = await poService.approvePurchaseOrder(po.id!, managerContext);
    expect(approved.status).toBe('To Receive and Bill');
  });

  it('tracks goods receipt (GRN) and vendor invoicing progress to Completed status', async () => {
    const po = await poService.createPurchaseOrder(
      {
        company_id: companyId,
        supplier_id: supplierId,
        schedule_date: '2026-06-15',
        items: [
          {
            item_id: itemId,
            item_code: 'STEEL-INGOT-01',
            item_name: 'Mild Steel Ingot 100mm',
            qty: '20.000000',
            rate: '1000.000000',
            uom_id: uomId,
          },
        ],
      },
      creatorContext
    );

    // Partial receipt of 10
    const partialRec = await poService.updateReceiptProgress(
      po.id!,
      { [itemId]: '10.000000' },
      tenantId
    );
    expect(Decimal.from(partialRec.received_percent).toNumber()).toBe(50);

    // Complete receipt (20)
    await poService.updateReceiptProgress(po.id!, { [itemId]: '20.000000' }, tenantId);

    // Complete vendor billing (20)
    const completed = await poService.updateBillingProgress(
      po.id!,
      { [itemId]: '20.000000' },
      tenantId
    );
    expect(Decimal.from(completed.billed_percent).toNumber()).toBe(100);
    expect(completed.status).toBe('Completed');

    // Cancelling a fulfilled PO is forbidden
    await expect(
      poService.cancelPurchaseOrder(po.id!, 'Vendor cancelled', creatorContext)
    ).rejects.toThrow(BusinessRuleError);
  });
});
