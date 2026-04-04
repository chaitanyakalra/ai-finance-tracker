import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    googleId: { type: String, unique: true, sparse: true },
    email: { type: String, required: true, unique: true },
    name: { type: String },
    profilePic: { type: String },
    // RBAC role — replaces old free-text role field
    role: {
        type: String,
        enum: ['viewer', 'analyst', 'admin'],
        default: 'viewer',
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },
    lastLogin: { type: Date },
    // Legacy fields preserved so nothing breaks
    isTeacher: { type: Boolean, default: false },
    isStudent: { type: Boolean, default: false },
    hasAwardedGrant: { type: Boolean, default: false },
    hasReceivedGrant: { type: Boolean, default: false },
}, { timestamps: true });

// Indexes for fast lookups
userSchema.index({ role: 1 });

export default mongoose.model('User', userSchema);
