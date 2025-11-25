import mongoose from 'mongoose';

const grantSchema = new mongoose.Schema({
    grantId: { 
        type: String, 
        required: true, 
        unique: true,
        default: () => `GRT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    },
    facultyId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    studentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        default: null // Set when student accepts invitation
    },
    studentEmail: { 
        type: String, 
        required: true,
        lowercase: true,
        trim: true
    },
    totalAmount: { 
        type: Number, 
        required: true,
        min: 0
    },
    usedAmount: { 
        type: Number, 
        default: 0,
        min: 0
    },
    remainingAmount: { 
        type: Number, 
        required: true
    },
    status: { 
        type: String, 
        enum: ['pending', 'active', 'completed', 'cancelled'],
        default: 'pending'
    },
    invitationToken: {
        type: String,
        default: null
    },
    invitationSentAt: {
        type: Date,
        default: null
    },
    invitationAcceptedAt: {
        type: Date,
        default: null
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    }
}, { timestamps: true });

// Calculate remaining amount before saving
grantSchema.pre('save', function() {
    if (this.isModified('usedAmount') || this.isModified('totalAmount')) {
        this.remainingAmount = this.totalAmount - this.usedAmount;
    }
});

// Check if grant is expired
grantSchema.methods.isExpired = function() {
    return new Date() > this.expiresAt;
};

// Check if grant has sufficient balance
grantSchema.methods.hasSufficientBalance = function(amount) {
    return this.remainingAmount >= amount;
};

export default mongoose.model('Grant', grantSchema);
