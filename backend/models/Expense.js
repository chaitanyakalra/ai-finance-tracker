import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },

    type: {
        type: String,
        enum: ['income', 'expense'],
        required: true,
        index: true,
    },
    category: {
        type: String,
        enum: ['Food','Transport','Shopping','Bills','Entertainment','Salary','Bonus','Investment','Healthcare','Education','Others'],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: [0.01, 'Amount must be at least 0.01'],
        validate: {
            validator: (v) => v > 0,
            message: 'Amount must be a positive number',
        },
    },
    date: {
        type: Date,
        required: true,
        validate: {
            validator: (v) => v <= new Date(),
            message: 'Date cannot be in the future',
        },
    },
    description: { type: String, maxlength: 500, trim: true },
    tags: { type: [String], default: [] },
    isRecurring: { type: Boolean, default: false },
    recurringFrequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly', null],
        default: null,
    },
    recurringEndDate: { type: Date, default: null },
    notes: { type: String, maxlength: 1000 },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

// Compound indexes for common query patterns
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1 });
expenseSchema.index({ userId: 1, type: 1 });

// Pre-save: enforce recurringFrequency when isRecurring is true
expenseSchema.pre('save', function () {
    if (this.isRecurring && !this.recurringFrequency) {
        throw new Error('recurringFrequency is required when isRecurring is true');
    }
    if (!this.isRecurring) {
        this.recurringFrequency = null;
        this.recurringEndDate = null;
    }
});

export default mongoose.model('Expense', expenseSchema);
