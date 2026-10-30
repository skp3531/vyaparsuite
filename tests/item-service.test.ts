import { describe, it, expect, beforeEach } from './helpers/test-runner';
import { ItemService } from '@/modules/inventory/services/item-service';
import { MockDatabaseAdapter } from './helpers/mock-db-adapter';
import { Decimal } from '@/lib/utils/decimal';

describe('ItemService', () => {
  let db: MockDatabaseAdapter;
  let service: ItemService;
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const companyId = '11111111-1111-1111-1111-111111111111';
  const userId = '22222222-2222-2222-2222-222222222222';
  const context = { tenantId, companyId, userId };

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    service = new ItemService(db);
  });

  it('performs UOM conversions in both forward and reciprocal directions', async () => {
    const nosUom = await service.createUom({ uom_name: 'Nos' }, context);
    const boxUom = await service.createUom({ uom_name: 'Box' }, context);

    // 1 Box = 12 Nos
    await service.createUomConversion(
      {
        from_uom_id: boxUom.id!,
        to_uom_id: nosUom.id!,
        conversion_factor: '12.000000',
      },
      context
    );

    // Forward: 5 Boxes -> Nos
    const fwd = await service.convertUomQuantity({
      fromUomId: boxUom.id!,
      toUomId: nosUom.id!,
      quantity: '5',
      tenantId,
    });
    expect(fwd.convertedQuantity.toFixed(2)).toBe('60.00');
    expect(fwd.isReciprocal).toBe(false);

    // Reciprocal: 24 Nos -> Boxes
    const rev = await service.convertUomQuantity({
      fromUomId: nosUom.id!,
      toUomId: boxUom.id!,
      quantity: '24',
      tenantId,
    });
    expect(rev.convertedQuantity.toFixed(2)).toBe('2.00');
    expect(rev.isReciprocal).toBe(true);
  });

  it('generates item variants from templates', async () => {
    const group = await service.createItemGroup({ item_group_name: 'Apparel' }, context);
    const uom = await service.createUom({ uom_name: 'Pcs' }, context);

    const template = await service.createItem(
      {
        item_code: 'TSHIRT-BASE',
        item_name: 'Crew Neck T-Shirt',
        item_group_id: group.id!,
        stock_uom_id: uom.id!,
        has_variants: true,
        standard_rate: '499.00',
      },
      context
    );

    const variants = await service.generateVariants(
      template.id!,
      [
        { Size: 'M', Color: 'Red' },
        { Size: 'L', Color: 'Blue' },
      ],
      context
    );

    expect(variants.length).toBe(2);
    expect(variants[0].item_code).toBe('TSHIRT-BASE-RED-M');
    expect(variants[1].item_code).toBe('TSHIRT-BASE-BLUE-L');
    expect(variants[0].variant_of_id).toBe(template.id);
  });

  it('resolves price list pricing and promotional discounts', async () => {
    const group = await service.createItemGroup({ item_group_name: 'Hardware' }, context);
    const uom = await service.createUom({ uom_name: 'Units' }, context);

    const item = await service.createItem(
      {
        item_code: 'VALVE-SS-01',
        item_name: 'Stainless Steel Valve 1 inch',
        item_group_id: group.id!,
        stock_uom_id: uom.id!,
        standard_rate: '500.00',
      },
      context
    );

    const priceList = await service.createPriceList(
      {
        price_list_name: 'Wholesale B2B',
        currency: 'INR',
        buying_or_selling: 'Selling',
      },
      context
    );

    // Standard tier: qty >= 1: rate 450
    await service.createItemPrice(
      {
        price_list_id: priceList.id!,
        item_id: item.id!,
        uom_id: uom.id!,
        price_rate: '450.00',
        min_qty: '1.00',
      },
      context
    );

    // Bulk tier: qty >= 50: rate 400
    await service.createItemPrice(
      {
        price_list_id: priceList.id!,
        item_id: item.id!,
        uom_id: uom.id!,
        price_rate: '400.00',
        min_qty: '50.00',
      },
      context
    );

    // Single unit order
    const p1 = await service.getItemPrice({
      itemId: item.id!,
      priceListId: priceList.id!,
      quantity: 10,
      tenantId,
    });
    expect(p1.finalRate.toFixed(2)).toBe('450.00');
    expect(p1.source).toBe('price_list');

    // Bulk order (60 units) gets 400 rate tier
    const p2 = await service.getItemPrice({
      itemId: item.id!,
      priceListId: priceList.id!,
      quantity: 60,
      tenantId,
    });
    expect(p2.finalRate.toFixed(2)).toBe('400.00');

    // Add promotional rule: 10% off on this item for quantities >= 100
    db.seed('pricing_rule', [
      {
        id: 'prule-1',
        tenant_id: tenantId,
        title: 'Super Bulk 10% Off',
        apply_on: 'Item Code',
        item_id: item.id,
        min_qty: '100.00',
        min_amt: '0.00',
        discount_percentage: '10.000000',
        discount_amount: '0.00',
        priority: 10,
        is_active: true,
      },
    ]);

    // Order of 100 units gets 400 base - 10% (40) = 360 final rate
    const p3 = await service.getItemPrice({
      itemId: item.id!,
      priceListId: priceList.id!,
      quantity: 100,
      tenantId,
    });
    expect(p3.baseRate.toFixed(2)).toBe('400.00');
    expect(p3.discountPercentage.toFixed(2)).toBe('10.00');
    expect(p3.finalRate.toFixed(2)).toBe('360.00');
    expect(p3.ruleApplied).toBe(true);
  });
});
