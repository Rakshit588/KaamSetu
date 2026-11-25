import { AuditLog } from '../models/AuditLog.js';

export type AuditInput = {
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  before?: unknown;
  after?: unknown;
};

function plain(value: unknown): unknown {
  if (value == null) return null;
  if (typeof value === 'object' && 'toObject' in value) {
    const toObject = (value as { toObject?: (opts?: unknown) => unknown }).toObject;
    if (typeof toObject === 'function') return toObject.call(value, { depopulate: true });
  }
  return value;
}

export async function recordAudit(input: AuditInput) {
  return AuditLog.create({
    adminId: input.adminId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    summary: {
      before: plain(input.before),
      after: plain(input.after),
    },
  });
}
