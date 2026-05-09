import type { Currency, GroupMember } from '@/types';

const CURRENCY_LOCALE: Record<Currency, string> = {
  ARS: 'es-AR',
  USD: 'en-US',
  BRL: 'pt-BR',
  EUR: 'es-ES',
};

export function formatMoney(amount: number | string, currency: Currency): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Number.isNaN(n)) return '—';
  try {
    return new Intl.NumberFormat(CURRENCY_LOCALE[currency], {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

export function formatDate(iso: string): string {
  // El backend usa "YYYY-MM-DD" para `date`, y timestamps ISO para createdAt.
  // Lo parseamos como local para que no se corra un día.
  const onlyDate = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const d = onlyDate ? new Date(`${iso}T00:00:00`) : new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function todayIsoDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function displayName(m: GroupMember): string {
  return m.user?.name || m.invitedName || m.user?.email || m.invitedEmail || 'Sin nombre';
}

export function memberEmail(m: GroupMember): string | null {
  return m.user?.email || m.invitedEmail || null;
}
