import { Decimal } from '@/lib/utils/decimal';

export interface ValuationQueueLayer {
  qty: Decimal;
  rate: Decimal;
}

export class ValuationService {
  /**
   * Recalculates Moving Average valuation rate for inward stock movement.
   * Formula:
   * new_rate = (current_qty * current_rate + inward_qty * inward_rate) / (current_qty + inward_qty)
   */
  static calculateMovingAverageInward(
    currentQty: Decimal,
    currentRate: Decimal,
    inwardQty: Decimal,
    inwardRate: Decimal
  ): { newQty: Decimal; newValuationRate: Decimal; newStockValue: Decimal; valueDifference: Decimal } {
    const newQty = currentQty.add(inwardQty);

    if (newQty.lessThanOrEqual(Decimal.zero())) {
      return {
        newQty: Decimal.zero(),
        newValuationRate: currentRate,
        newStockValue: Decimal.zero(),
        valueDifference: inwardQty.multiply(inwardRate).round(2),
      };
    }

    const currentTotalValue = currentQty.multiply(currentRate);
    const inwardTotalValue = inwardQty.multiply(inwardRate);
    const newStockValue = currentTotalValue.add(inwardTotalValue).round(2);
    const newValuationRate = newStockValue.divide(newQty).round(2);
    const valueDifference = inwardTotalValue.round(2);

    return {
      newQty,
      newValuationRate,
      newStockValue,
      valueDifference,
    };
  }

  /**
   * Calculates outward stock movement valuation using current Moving Average rate.
   * Stock rate remains constant during outward issues/deliveries; total stock value decreases.
   */
  static calculateMovingAverageOutward(
    currentQty: Decimal,
    currentRate: Decimal,
    outwardQty: Decimal
  ): { newQty: Decimal; newValuationRate: Decimal; newStockValue: Decimal; valueDifference: Decimal } {
    const newQty = currentQty.subtract(outwardQty);
    const valueDifference = outwardQty.multiply(currentRate).negate().round(2);
    const newStockValue = newQty.multiply(currentRate).round(2);

    return {
      newQty,
      newValuationRate: currentRate,
      newStockValue,
      valueDifference,
    };
  }

  /**
   * Calculates outward stock consumption using FIFO layers.
   * Consumes oldest batches/inward layers first.
   */
  static consumeFifoQueue(
    queue: ValuationQueueLayer[],
    consumeQty: Decimal
  ): {
    consumedLayers: Array<{ qty: Decimal; rate: Decimal; amount: Decimal }>;
    totalConsumedValue: Decimal;
    effectiveRate: Decimal;
    remainingQueue: ValuationQueueLayer[];
  } {
    let remainingToConsume = consumeQty;
    const consumedLayers: Array<{ qty: Decimal; rate: Decimal; amount: Decimal }> = [];
    let totalConsumedValue = Decimal.zero();
    const newQueue: ValuationQueueLayer[] = [];

    for (const layer of queue) {
      if (remainingToConsume.isZero()) {
        newQueue.push(layer);
        continue;
      }

      if (layer.qty.lessThanOrEqual(remainingToConsume)) {
        // Entire layer is consumed
        const consumedAmount = layer.qty.multiply(layer.rate).round(2);
        consumedLayers.push({
          qty: layer.qty,
          rate: layer.rate,
          amount: consumedAmount,
        });
        totalConsumedValue = totalConsumedValue.add(consumedAmount);
        remainingToConsume = remainingToConsume.subtract(layer.qty);
      } else {
        // Partial layer consumed
        const consumedAmount = remainingToConsume.multiply(layer.rate).round(2);
        consumedLayers.push({
          qty: remainingToConsume,
          rate: layer.rate,
          amount: consumedAmount,
        });
        totalConsumedValue = totalConsumedValue.add(consumedAmount);

        // Put remainder back in queue
        newQueue.push({
          qty: layer.qty.subtract(remainingToConsume),
          rate: layer.rate,
        });
        remainingToConsume = Decimal.zero();
      }
    }

    const effectiveRate = consumeQty.isZero()
      ? Decimal.zero()
      : totalConsumedValue.divide(consumeQty).round(2);

    return {
      consumedLayers,
      totalConsumedValue,
      effectiveRate,
      remainingQueue: newQueue,
    };
  }
}
