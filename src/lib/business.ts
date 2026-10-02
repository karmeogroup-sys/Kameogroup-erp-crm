export function toMoney(value: unknown) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) throw new Error('Montant invalide');
  return Math.round(n * 100) / 100;
}
export function assertNonNegative(value: unknown, label='Montant') {
  const n = toMoney(value);
  if (n < 0) throw new Error(`${label} ne peut pas être négatif`);
  return n;
}
export function invoiceState(total:number, paid:number, dueDate?:string|null){
  if (paid >= total && total > 0) return 'paid';
  if (dueDate && new Date(dueDate).getTime() < Date.now()) return 'overdue';
  if (paid > 0) return 'partial';
  return 'unpaid';
}
export function grossMargin(contractValue:number, actualCost:number){
  return toMoney(contractValue) - toMoney(actualCost);
}
