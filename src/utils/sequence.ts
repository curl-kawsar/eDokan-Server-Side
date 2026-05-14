/**
 * Generate a human-readable sequential number with prefix + date + counter
 * e.g. JOB-20260513-0001, INV-20260513-0001
 */
export function generateDocumentNumber(prefix: string, sequence: number): string {
  const now = new Date();
  const yyyy = now.getFullYear().toString();
  const mm = (now.getMonth() + 1).toString().padStart(2, "0");
  const dd = now.getDate().toString().padStart(2, "0");
  const seq = sequence.toString().padStart(4, "0");
  return `${prefix}-${yyyy}${mm}${dd}-${seq}`;
}
