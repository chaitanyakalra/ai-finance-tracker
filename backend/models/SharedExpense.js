import mongoose from 'mongoose';

const sharedExpenseSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    groupId: { type: String, required: true },
    createdBy: { type: String, required: true },  // who added it

    description: { type: String },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    date: { type: String, required: true },

    // Who owes what
    splits: [
        {
            userId: { type: String, required: true },
            amount: { type: Number, required: true }   // share amount
        }
    ]
}, { timestamps: true });

export default mongoose.model('SharedExpense', sharedExpenseSchema);
