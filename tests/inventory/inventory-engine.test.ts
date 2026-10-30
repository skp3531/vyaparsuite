import { describe, it, beforeEach } from 'node:test';
import { expect } from '../helpers/test-runner';
import { MockDatabaseAdapter } from '../helpers/mock-db';
import { Decimal } from '@/lib/utils/decimal';
import { InsufficientStockError } from '@/lib/utils/errors';
import { ValuationService } from '@/modules/inventory/services/valuation-service';
import { StockLedgerService } from '@/modules/inventory/services/stock-ledger-service';
import { DeliveryNoteService } from '@/modules/inventory/services/delivery-note-service';
import { PurchaseReceiptService } from '@/modules/inventory/services/purchase-receipt-service';
import { StockTransferService } from '@/modules/inventory/services/stock-transfer-service';
import { StockReconciliationService } from '@/modules/inventory/services/stock-reconciliation-service';
import { SalesOrderService } from '@/modules/sales/services/sales-order-service';
import { PurchaseOrderService } from '@/modules/purchase/services/purchase-order-service';

describe('Phase 4: Inventory Engine & Stock Ledger Tests', () => {
  let db: MockDatabaseAdapter;
  let stockLedgerService: StockLedgerService;
  let deliveryNoteService: DeliveryNoteService;
  let purchaseReceiptService: PurchaseReceiptService;
  let stockTransferService: StockTransferService;
  let stockReconciliationService: StockReconciliationService;
  let salesOrderService: SalesOrderService;
  let purchaseOrderService: PurchaseOrderService;

  const context = {
    tenantId: '00000000-0000-4000-a000-000000000001',
    companyId: '11111111-1111-4111-a111-111111111111',
    userId: '22222222-2222-4222-a222-222222222222',
    roles: ['Inventory Manager', 'Sales Manager', 'Purchase Manager'],
  };

  const WH_MAIN = 'aaaa0001-0000-4000-a000-000000000001';
  const WH_SECONDARY = 'aaaa0002-0000-4000-a000-000000000002';
  const ITEM_RAW = 'bbbb0001-0000-4000-a000-000000000001';
  const ITEM_FINISHED = 'bbbb0002-0000-4000-a000-000000000002';
  const UOM_NOS = 'cccc0001-0000-4000-a000-000000000001';
  const CUSTOMER_ID = 'dddd0001-0000-4000-a000-000000000001';
  const SUPPLIER_ID = 'eeee0001-0000-4000-a000-000000000001';

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    stockLedgerService = new StockLedgerService(db);
    deliveryNoteService = new DeliveryNoteService(db);
    purchaseReceiptService = new PurchaseReceiptService(db);
    stockTransferService = new StockTransferService(db);
    stockReconciliationService = new StockReconciliationService(db);
    salesOrderService = new SalesOrderService(db);
    purchaseOrderService = new PurchaseOrderService(db);
  });

  describe('ValuationService Algorithms', () => {
    it('calculates Moving Average rate correctly on inward receipts', () => {
      // Existing: 10 units @ 100 = 1000 total value
      // Inward: 10 units @ 150 = 1500 total value
      // New: 20 units with value 2500 -> new rate = 125.00
      const currentQty = Decimal.from(10);
      const currentRate = Decimal.from(100);
      const inwardQty = Decimal.from(10);
      const inwardRate = Decimal.from(150);

      const result = ValuationService.calculateMovingAverageInward(
        currentQty,
        currentRate,
        inwardQty,
        inwardRate
      );

      expect(result.newQty.toString(2)).toBe('20.00');
      expect(result.newValuationRate.toString(2)).toBe('125.00');
      expect(result.newStockValue.toString(2)).toBe('2500.00');
      expect(result.valueDifference.toString(2)).toBe('1500.00');
    });

    it('consumes inventory layers sequentially in FIFO order', () => {
      // Layer 1: 5 units @ 100
      // Layer 2: 10 units @ 120
      // Consume: 8 units -> 5 units @ 100 + 3 units @ 120 = 500 + 360 = 860
      const queue = [
        { qty: Decimal.from(5), rate: Decimal.from(100) },
        { qty: Decimal.from(10), rate: Decimal.from(120) },
      ];

      const result = ValuationService.consumeFifoQueue(queue, Decimal.from(8));

      expect(result.consumedLayers.length).toBe(2);
      expect(result.consumedLayers[0].qty.toString(2)).toBe('5.00');
      expect(result.consumedLayers[0].rate.toString(2)).toBe('100.00');
      expect(result.consumedLayers[1].qty.toString(2)).toBe('3.00');
      expect(result.consumedLayers[1].rate.toString(2)).toBe('120.00');
      expect(result.totalConsumedValue.toString(2)).toBe('860.00');

      // Remaining queue should have 7 units @ 120
      expect(result.remainingQueue.length).toBe(1);
      expect(result.remainingQueue[0].qty.toString(2)).toBe('7.00');
      expect(result.remainingQueue[0].rate.toString(2)).toBe('120.00');
    });
  });

  describe('StockLedgerService & Negative Stock Guard', () => {
    it('blocks outward stock issues when balance is insufficient', async () => {
      // Warehouse starts empty (0 qty). Attempting to issue 5 units should throw InsufficientStockError
      await expect(
        stockLedgerService.postEntry(
          {
            tenant_id: context.tenantId,
            company_id: context.companyId,
            item_id: ITEM_RAW,
            warehouse_id: WH_MAIN,
            posting_date: '2026-10-30',
            actual_qty: '-5.000000',
            voucher_type: 'Delivery Note',
            voucher_id: '55555555-5555-4555-a555-555555555555',
          },
          context
        )
      ).rejects.toThrow(InsufficientStockError);
    });

    it('successfully posts inward receipt and updates Bin balance & valuation', async () => {
      const sle = await stockLedgerService.postEntry(
        {
          tenant_id: context.tenantId,
          company_id: context.companyId,
          item_id: ITEM_RAW,
          warehouse_id: WH_MAIN,
          posting_date: '2026-10-30',
          actual_qty: '50.000000',
          incoming_rate: '200.000000',
          voucher_type: 'Purchase Receipt',
          voucher_id: '66666666-6666-4666-a666-666666666666',
        },
        context
      );

      expect(sle).toBeDefined();
      expect(sle.qty_after_transaction).toBe('50.000000');
      expect(sle.valuation_rate).toBe('200.000000');
      expect(sle.stock_value).toBe('10000.000000');

      // Verify cached Bin
      const bin = await stockLedgerService.getBalance(ITEM_RAW, WH_MAIN, context);
      expect(bin.actual_qty).toBe('50.000000');
      expect(bin.valuation_rate).toBe('200.000000');
      expect(bin.stock_value).toBe('10000.000000');
    });
  });

  describe('Delivery Note Fulfillment Lifecycle', () => {
    it('creates draft, submits delivery note, updates sales order delivery progress, and handles cancellation', async () => {
      // 1. First inward 100 finished items into WH_MAIN
      await stockLedgerService.postEntry(
        {
          tenant_id: context.tenantId,
          company_id: context.companyId,
          item_id: ITEM_FINISHED,
          warehouse_id: WH_MAIN,
          posting_date: '2026-10-30',
          actual_qty: '100.000000',
          incoming_rate: '500.000000',
          voucher_type: 'Purchase Receipt',
          voucher_id: '77777777-7777-4777-a777-777777777777',
        },
        context
      );

      // 2. Setup mock Sales Order with 20 ordered items
      const soRes = await db.insert<any>('sales_order', {
        tenant_id: context.tenantId,
        company_id: context.companyId,
        order_number: 'SO-TEST-001',
        customer_id: CUSTOMER_ID,
        posting_date: '2026-10-30',
        status: 'Approved',
        grand_total: '12000.000000',
        delivered_percent: '0.00',
        billed_percent: '0.00',
        created_by: context.userId,
      });
      const soId = soRes.data.id;

      const soItemRes = await db.insert<any>('sales_order_item', {
        tenant_id: context.tenantId,
        sales_order_id: soId,
        item_id: ITEM_FINISHED,
        warehouse_id: WH_MAIN,
        uom_id: UOM_NOS,
        qty: '20.000000',
        rate: '600.000000',
        amount: '12000.000000',
        delivered_qty: '0.000000',
        billed_qty: '0.000000',
      });
      const soItemId = soItemRes.data.id;

      // 3. Create Draft Delivery Note for 15 units (partial fulfillment)
      const dn = await deliveryNoteService.create(
        {
          tenant_id: context.tenantId,
          company_id: context.companyId,
          customer_id: CUSTOMER_ID,
          customer_name: 'Apex Industrial',
          posting_date: '2026-10-30',
          transporter_name: 'SafeX Logistics',
          vehicle_no: 'DL-01-AB-1234',
          eway_bill_no: 'EWB-998877665544',
          items: [
            {
              item_id: ITEM_FINISHED,
              warehouse_id: WH_MAIN,
              uom_id: UOM_NOS,
              qty: '15.000000',
              rate: '600.000000',
              sales_order_id: soId,
              sales_order_item_id: soItemId,
            },
          ],
        },
        context
      );

      expect(dn.status).toBe('Draft');
      expect(dn.delivery_note_number).toBeDefined();

      // 4. Submit Delivery Note
      const submittedDn = await deliveryNoteService.submit(dn.id!, context);
      expect(submittedDn.status).toBe('Submitted');

      // Check stock balance deducted (100 - 15 = 85 units)
      const binAfterDispatch = await stockLedgerService.getBalance(ITEM_FINISHED, WH_MAIN, context);
      expect(binAfterDispatch.actual_qty).toBe('85.000000');

      // Check SO progress updated: 15 / 20 = 75.00%
      const soUpdated = (await db.findById<any>('sales_order', soId, { tenantId: context.tenantId })).data;
      expect(soUpdated.delivered_percent).toBe('75.00');

      // 5. Cancel Delivery Note
      const cancelledDn = await deliveryNoteService.cancel(dn.id!, 'Customer requested delivery rescheduling', context);
      expect(cancelledDn.status).toBe('Cancelled');

      // Check stock restored back to 100 units
      const binAfterCancel = await stockLedgerService.getBalance(ITEM_FINISHED, WH_MAIN, context);
      expect(binAfterCancel.actual_qty).toBe('100.000000');

      // Check SO delivered percent restored to 0.00%
      const soAfterCancel = (await db.findById<any>('sales_order', soId, { tenantId: context.tenantId })).data;
      expect(soAfterCancel.delivered_percent).toBe('0.00');
    });
  });

  describe('Purchase Receipt (GRN) & PO Progress', () => {
    it('receives goods into warehouse, updates valuation and PO fulfillment', async () => {
      // 1. Setup mock PO for 50 raw materials
      const poRes = await db.insert<any>('purchase_order', {
        tenant_id: context.tenantId,
        company_id: context.companyId,
        po_number: 'PO-TEST-001',
        supplier_id: SUPPLIER_ID,
        posting_date: '2026-10-30',
        status: 'Approved',
        grand_total: '10000.000000',
        received_percent: '0.00',
        billed_percent: '0.00',
        created_by: context.userId,
      });
      const poId = poRes.data.id;

      const poItemRes = await db.insert<any>('purchase_order_item', {
        tenant_id: context.tenantId,
        purchase_order_id: poId,
        item_id: ITEM_RAW,
        warehouse_id: WH_MAIN,
        uom_id: UOM_NOS,
        qty: '50.000000',
        rate: '200.000000',
        amount: '10000.000000',
        received_qty: '0.000000',
        billed_qty: '0.000000',
      });
      const poItemId = poItemRes.data.id;

      // 2. Create and submit Goods Receipt Note for full 50 units
      const pr = await purchaseReceiptService.create(
        {
          tenant_id: context.tenantId,
          company_id: context.companyId,
          supplier_id: SUPPLIER_ID,
          supplier_name: 'RawMetals Corp',
          posting_date: '2026-10-30',
          items: [
            {
              item_id: ITEM_RAW,
              warehouse_id: WH_MAIN,
              uom_id: UOM_NOS,
              qty: '50.000000',
              rate: '200.000000',
              purchase_order_id: poId,
              purchase_order_item_id: poItemId,
            },
          ],
        },
        context
      );

      const submittedPr = await purchaseReceiptService.submit(pr.id!, context);
      expect(submittedPr.status).toBe('Submitted');

      // Check stock balance is 50 units in WH_MAIN
      const bin = await stockLedgerService.getBalance(ITEM_RAW, WH_MAIN, context);
      expect(bin.actual_qty).toBe('50.000000');
      expect(bin.valuation_rate).toBe('200.000000');

      // Check PO received percentage is 100.00%
      const poUpdated = (await db.findById<any>('purchase_order', poId, { tenantId: context.tenantId })).data;
      expect(poUpdated.received_percent).toBe('100.00');
    });
  });

  describe('Stock Transfer & Stock Reconciliation', () => {
    it('relocates stock between warehouses with balanced dual SLE postings', async () => {
      // 1. Add 40 units to WH_MAIN
      await stockLedgerService.postEntry(
        {
          tenant_id: context.tenantId,
          company_id: context.companyId,
          item_id: ITEM_FINISHED,
          warehouse_id: WH_MAIN,
          posting_date: '2026-10-30',
          actual_qty: '40.000000',
          incoming_rate: '300.000000',
          voucher_type: 'Stock Entry',
          voucher_id: '88888888-8888-4888-a888-888888888888',
        },
        context
      );

      // 2. Transfer 15 units from WH_MAIN to WH_SECONDARY
      const st = await stockTransferService.create(
        {
          tenant_id: context.tenantId,
          company_id: context.companyId,
          from_warehouse_id: WH_MAIN,
          to_warehouse_id: WH_SECONDARY,
          posting_date: '2026-10-30',
          purpose: 'Branch Stock Transfer',
          items: [
            {
              item_id: ITEM_FINISHED,
              uom_id: UOM_NOS,
              qty: '15.000000',
            },
          ],
        },
        context
      );

      await stockTransferService.submit(st.id!, context);

      // Verify source warehouse has 40 - 15 = 25 units
      const sourceBin = await stockLedgerService.getBalance(ITEM_FINISHED, WH_MAIN, context);
      expect(sourceBin.actual_qty).toBe('25.000000');

      // Verify destination warehouse has 15 units
      const targetBin = await stockLedgerService.getBalance(ITEM_FINISHED, WH_SECONDARY, context);
      expect(targetBin.actual_qty).toBe('15.000000');
      expect(targetBin.valuation_rate).toBe('300.000000');
    });

    it('audits physical count variance and reconciles book stock balance', async () => {
      // 1. Initial balance: 25 units in WH_MAIN
      await stockLedgerService.postEntry(
        {
          tenant_id: context.tenantId,
          company_id: context.companyId,
          item_id: ITEM_FINISHED,
          warehouse_id: WH_MAIN,
          posting_date: '2026-10-30',
          actual_qty: '25.000000',
          incoming_rate: '300.000000',
          voucher_type: 'Purchase Receipt',
          voucher_id: '99999999-9999-4999-a999-999999999999',
        },
        context
      );

      // Physical count finds 28 units (surplus of 3 units)
      const rec = await stockReconciliationService.create(
        {
          tenant_id: context.tenantId,
          company_id: context.companyId,
          posting_date: '2026-10-30',
          purpose: 'Quarterly Physical Audit',
          items: [
            {
              item_id: ITEM_FINISHED,
              warehouse_id: WH_MAIN,
              counted_qty: '28.000000',
              new_valuation_rate: '300.000000',
            },
          ],
        },
        context
      );

      expect(rec.items[0].current_qty).toBe('25.000000');
      expect(rec.items[0].counted_qty).toBe('28.000000');
      expect(rec.items[0].qty_difference).toBe('3.000000');

      // Submit reconciliation
      await stockReconciliationService.submit(rec.id!, context);

      // Warehouse balance should now match counted quantity exactly: 28.000000
      const reconciledBin = await stockLedgerService.getBalance(ITEM_FINISHED, WH_MAIN, context);
      expect(reconciledBin.actual_qty).toBe('28.000000');
    });
  });
});
