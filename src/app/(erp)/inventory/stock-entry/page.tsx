import { redirect } from 'next/navigation';

export default function StockEntryRedirect() {
  redirect('/inventory/stock-entries');
}
