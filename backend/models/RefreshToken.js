import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
}, { timestamps: true });

export default mongoose.model('RefreshToken', refreshTokenSchema);
