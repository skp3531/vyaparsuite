import { redirect } from 'next/navigation';

export default function ItemRedirectPage() {
  redirect('/inventory/items');
}
