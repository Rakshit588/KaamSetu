import { formatINR } from '@/lib/format';

export function Money({ value, className = '' }: { value: number | null | undefined; className?: string }) {
  return <span className={className}>{formatINR(value)}</span>;
}
