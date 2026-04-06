import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const roleRequestSchema = new mongoose.Schema(
    {
        id: { type: String, default: uuidv4, unique: true },
        userId: { type: String, required: true, index: true },
        requestedRole: {
            type: String,
            enum: ['analyst', 'admin'],
            required: true,
        },
        reason: { type: String, required: true, minlength: 20, maxlength: 1000 },
        status: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'REJECTED'],
            default: 'PENDING',
            index: true,
        },
        adminNotes: { type: String, default: null },
        rejectionReason: { type: String, default: null },
        reviewedBy: { type: String, default: null },
        reviewedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

roleRequestSchema.index({ userId: 1, status: 1 });
roleRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('RoleRequest', roleRequestSchema);
