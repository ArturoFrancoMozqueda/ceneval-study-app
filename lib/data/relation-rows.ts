export function relationRows<Row extends object>(
  value: Row | Row[] | null | undefined,
): Row[] {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}
