import { Schema, model, Types } from 'mongoose';

const auditLogSchema = new Schema(
  {
    adminId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true, index: true },
    targetType: { type: String, required: true, index: true },
    targetId: { type: String, required: true },
    summary: {
      before: { type: Schema.Types.Mixed, default: null },
      after: { type: Schema.Types.Mixed, default: null },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ createdAt: -1, _id: -1 });
auditLogSchema.index({ adminId: 1, createdAt: -1 });

export const AuditLog = model('AuditLog', auditLogSchema);
