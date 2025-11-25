import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },  // Group name
    createdBy: { type: String, required: true }, // userId of group admin
    members: [
        {
            userId: { type: String, required: true },
            joinedAt: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

export default mongoose.model('Group', groupSchema);
